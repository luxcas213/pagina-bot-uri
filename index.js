const express = require('express');
const jwt = require('jsonwebtoken'); 
require('dotenv').config();
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const verifyToken = (req, res, next) => {
    const token = req.query.token;

    if (!token) {
        return res.status(403).send('<h1>No estás autorizado. <a href="/">Volver</a></h1>');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send('<h1>Token inválido. <a href="/">Volver</a></h1>');
        }
        req.user = decoded;
        next();
    });
};

app.get('/estado-bot', verifyToken, (req, res) => {
    //id proceso
    exec('ps xw', (error, stdout, stderr) => {
        if (error) {
            return res.send(`Error: ${error.message}`);
        }
        if (stderr) {
            return res.send(`stderr: ${stderr}`);
        }

        const botRunning = stdout.includes('node .');
        if (botRunning) {
            res.send('<h1>El bot está prendido.</h1>');
        } else {
            res.send('<h1>El bot está apagado.</h1>');
        }
    });
});



app.post('/reiniciar-bot', verifyToken, (req, res) => {
    //buscar id proceso
    exec('pgrep -f "^node .$"', (error, stdout, stderr) => {
        if (error) {
            return res.send(`<h1>No se encontró el bot en ejecución.</h1> ,Error: ${error.message}`);
        }
        if (stderr) {
            return res.send(`stderr: ${stderr}`);
        }
        if (!stdout) 
        {
            return res.send('<h1>No se encontró el bot en ejecución.</h1>');
        }

        //matar
        exec(`kill ${stdout}`, (errorKill, stdoutKill, stderrKill) => {
            if (errorKill) {
                return res.send(`Error al matar el proceso: ${errorKill.message}`);
            }
            if (stderrKill) {
                return res.send(`stderr: ${stderrKill}`);
            }
            //reinicio
            exec('nohup npm start --prefix /home/ubuntu/tbot/', (errorStart, stdoutStart, stderrStart) => {
                if (errorStart) {
                    return res.send(`<h1>Error al iniciar el bot</h1> ,   Error: ${errorStart.message}`);
                }
                if (stderrStart) {
                    return res.send(`stderr: ${stderrStart}`);
                }
                return res.send('<h1>Bot iniciado con éxito.</h1>');
            });
        });
        return res.send('<h1>Bot iniciado con éxito.</h1>');
    });
});

app.get('/logs', verifyToken, (req, res) => {
    exec('tail -n 30 /home/ubuntu/tbot/nohup.out', (error, stdout, stderr) => {
        if (error) {
            return res.send(`<h1>no se encontro los logs del bot</h1>, Error: ${error.message}`);
        }
        if (stderr) {
            return res.send(`stderr: ${stderr}`);
        }
        res.send(`<pre>${stdout}</pre>`);
    });
});

app.post('/apagar-bot', verifyToken, (req, res) => {
    //buscar id proceso
    exec('pgrep -f "^node .$"', (error, stdout, stderr) => {
        if (error) {
            return res.send(`Error: ${error.message}`);
        }
        if (stderr) {
            return res.send(`stderr: ${stderr}`);
        }
        if (!stdout) 
        {
            return res.send('<h1>No se encontró el bot en ejecución.</h1>');
        }

        //matar
        exec(`kill ${stdout}`, (errorKill, stdoutKill, stderrKill) => {
            if (errorKill) {
                return res.send(`Error al matar el proceso: ${errorKill.message}`);
            }
            if (stderrKill) {
                return res.send(`stderr: ${stderrKill}`);
            }
            return res.send('<h1>Bot apagado con éxito.</h1>');
        });
    });
});

app.post('/encender-bot', verifyToken, (req, res) => {
    //buscar id proceso
    exec('pgrep -f "^node .$"', (error, stdout, stderr) => {
        if (stderr) {
            return res.send(`stderr: ${stderr}`);
        }
        if (stdout) 
        {
            return res.send('<h1>El bot ya está en ejecución.</h1>');
        }
        if (error) {
            return exec('nohup npm --prefix /home/ubuntu/tbot/ start > nohup.out 2>&1 < /dev/null &', (errorStart, stdoutStart, stderrStart) => {
                if (errorStart) 
                {
                    return res.send(`Error al iniciar el bot: ${errorStart.message}`);
                }
                if (stderrStart) 
                {
                    return res.send(`stderr: ${stderrStart}`);
                }
                return res.send('<h1>Bot encendido con éxito.</h1>');
            });
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const validUser = process.env.USERNAME;
    const validPass = process.env.PASSWORD;
    
    if (username === validUser && password === validPass) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.redirect(`/main?token=${token}`);
    } else {
        res.redirect('/loginfallido');
    }
});

app.get('/logout', (req, res) => {
    res.redirect('/');
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});
app.get('/loginfallido', (req, res) => {
    res.sendFile(__dirname + '/views/loginfallido.html');
});
app.get('/main', verifyToken, (req, res) => {
    res.sendFile(__dirname + '/views/main.html');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
