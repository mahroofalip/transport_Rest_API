const express = require('express');
const app = express();
const http = require('http');
const socketConfig = require('./socket/Socket');
const morgan = require('morgan');
var bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
var bodyParser = require('body-parser');

const connectDB = require('./database_config/db');
const {
  notFound,
  errorHandler,
} = require('./middlewares/errHandlingMiddlleware');

const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/adminRoutes');
const sub_adminRoutes = require('./routes/sub_adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const driverRoutes = require('./routes/driverRoutes');


const server = http.createServer(app);

socketConfig(server);
dotenv.config();
connectDB();

if (process.env.NODE_ENV === 'DEVELOPMENT') {
  app.use(morgan('dev'));
}
app.use(cors());
app.use(express.json({ limit: '100mb', extended : true }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));


app.use(bodyParser.urlencoded({
  extended: true, limit : '100mb'
}));
app.use(bodyParser.json());  



app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sub-admin', sub_adminRoutes);
app.use('/api/driver', driverRoutes);
app.get('/favicon.ico', (req, res) => res.status(204));
const PORT = process.env.PORT || 4001;
const NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV === 'DEVELOPMENT') {
  app.use('/', indexRoutes);
}

app.use(errorHandler);
app.use(notFound);

server.listen(
  PORT,
  console.log(`Server Running on PORT ${PORT} in ${NODE_ENV} Mode`)
);
