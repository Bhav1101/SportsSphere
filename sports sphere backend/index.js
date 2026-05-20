require('dotenv').config()


const express=require("express")
const app = express();

const cors=require('cors')
app.use(cors());

const port=process.env.PORT


app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('server/public'))

const connectDB= require('./server/config/db')
connectDB();

const seed =require('./server/config/seeder')
seed()



app.use('/api/user',  require('./server/routes/userRoutes'))
app.use('/api/coach', require('./server/routes/coachRoutes'))
app.use('/api/admin', require('./server/routes/adminRoutes.js'))

app.get('/', (req, res) => {
    res.send("Welcome to Sports Management Server")
})


app.listen(port,(req,res) =>{
    console.log("App listening on port : ",port);
})