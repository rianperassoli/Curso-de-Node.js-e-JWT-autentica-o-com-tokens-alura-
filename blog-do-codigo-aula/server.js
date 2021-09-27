require('dotenv').config()

const app = require('./app');
const port = 3000;

require('./redis/blacklist')

const routes = require('./rotas');
routes(app);

app.listen(port, () => console.log(`App listening on port ${port}`));
