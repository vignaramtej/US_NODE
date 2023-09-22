const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

// MySQL connection configuration
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb'
});

connection.connect();

// Serve static files (e.g., CSS)
app.use(express.static('views'));


app.post('/register', (req, res) => {
    const { Fname, Lname, email, mobile, study, password } = req.body;

    const query = "INSERT INTO students (Fname, Lname, email, mobile, study, password) VALUES ('"+Fname+"', '"+Lname+"', '"+email+"','"+mobile+"','"+study+"','"+password+"')";
    connection.query(query, (error, result) => {
        if (error) throw error;

        const studentId = result.insertId ; // Assuming result.insertId contains the newly inserted student's ID
        assignRandomMentor(studentId);

        res.redirect('/success/' + studentId); // Pass studentId as a parameter
    });
});  

app.post('/studentlogin', (req, res) => {
    
  let { Fname, Lname, email, mobile, study, password } = req.body;

  console.log(req.body);
  const query = "SELECT * FROM students WHERE email ='"+email+"'  AND password = '"+password+"'";
  connection.query(query,(err, results) => {
      if (err) {
        console.error('MySQL query error:', err);
        return res.status(500).json({ message: 'An error occurred while checking login.' });
      }
      if (results.length === 1) {
        const stdid = results[0].id;
        req.session.studentID = stdid;
        let getquery = `SELECT * FROM students WHERE id = '${stdid}'`;
        connection.query(getquery,(err,result)=>{
          console.log(result[0]);      

          res.render('dashboard');
        });
      } else {
        // Render an error page with EJS
        res.render('newlogin', { message: 'Invalid email or password' });
      }
  });
});

app.get('/success/:studentId', (req, res) => {
    const studentId = req.params.studentId; // Get studentId from the URL parameter
    res.render('success', { students: studentId });
});


app.get('/SIH', (req,res) => {
  res.render('first');
});
app.get('/student', (req,res) => {
  res.render('newlogin');
});


const assignRandomMentor = (studentId) => {
    // Query the database to get a list of available mentors
    connection.query('SELECT * FROM mentors', (error, mentors) => {
      if (error) throw error;
      
      // Randomly select a mentor
      const randomMentor = mentors[Math.floor(Math.random() * mentors.length)];
      
      console.log(randomMentor);

      // Update the student's mentor_id in the database
      connection.query('UPDATE students SET mentor_id = ? WHERE id = ?', [randomMentor.mentor_id, studentId], (error, result) => {
        if (error) throw error;
        console.log(`Student with ID ${studentId} assigned to Mentor ID ${randomMentor.mentor_id}`);
      });
    });
};
  


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});