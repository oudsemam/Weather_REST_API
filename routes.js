const express = require('express');
//calls 
const pgp = require('pg-promise')();

const router = express.Router();

const db = pgp({
    user: 'postgres',
    password: 'Basil',
    database: 'Weather'
});

// db.many("SELECT * from states").then(() => console.log("works!"));

router.use(express.json());

router.get('/states', async (req, res)=> {
    res.json(await db.many("SELECT * from states"));
});

router.get("/states/:abbrev", async (req, res) => {
    const state = await db.oneOrNone('SELECT * from states WHERE abbrev = $(abbrev)', {
      abbrev: req.params.abbrev
      });

      if (!state){
          return res.status(404).send ('The state could not be found');
      }
});

//POST - add new state
//try catch handles the errors quickly along with not having to wait 20 seconds to time out.
router.post("/states", async (req, res) => {
  try {
    const exisiting = await db.oneOrNone ('SELECT abbrev, name FROM states WHERE abbrev = $(abbrev)', {abbrev: req.body.abbrev});
    if (exisiting) {
      return res.status(400).send("The state already exists");
    }
        await db.none('INSERT INTO states (abbrev, name) VALUES ($(abbrev), $(name))', {
            abbrev: req.body.abbrev,
            name: req.body.name
        });

        const state = await db.one('SELECT abbrev, name FROM states WHERE abbrev = $(abbrev)', {abbrev: req.body.abbrev});

        res.status(201).json(state);

    } catch (error) {

        if (error.constraint === 'states_pkey')
        return res.status(400).send ('The state already exisits');
    }
});

//get cities by id
router.get("/cities", async (req, res) => {
  res.json(await db.many(`
        SELECT c.id, s.name as state, c.name as city
        FROM cities c
        INNER JOIN states s ON s.abbrev = c.state_abbrev
  `));

});

//POST - new city
router.post("/cities", async (req, res) => {
  try {

      const exisiting = await db.oneOrNone ('SELECT state_abbrev, name, climate FROM cities WHERE name = $(name)', {name: req.body.name});

      if (exisiting){
        return res.status(400).send('The city already exists.')
      }

      const result = await db.none(
        "INSERT INTO cities (state_abbrev, name, climate) VALUES ($(state_abbrev), $(name), $(climate)) RETURNING id",
        {
          state_abbrev: req.body.state_abbrev,
          name: req.body.name,
          climate: req.body.climate
        }
      );
        console.log (id);

      const citiy = await db.one(
        "SELECT state_abbrev, name, climate FROM cities WHERE id = $(id)",
        { id: result.id }
      );

      return res.status(201).json(city);
      
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.get("/temperature", async (req, res)=> {
    try {
      const exisiting = await db.oneOrNone(
        "SELECT city_id, temperature, date FROM temperatures WHERE name = $(name)",
        { name: req.body.name }
      );

      if (exisiting) {
        return res.status(400).send("The city already exists.");
      }

      const result = await db.none(
        "INSERT INTO temperatures (city_id, temperature, date) VALUES ($(city_id), $(temperature), $(date)) RETURNING id",
        {
          city_id: req.body.city_id,
          temperature: req.body.temperature,
          date: req.body.date,
        }
      );

      const temperature = await db.one(
        "SELECT id, city_id, temperature, date FROM temperature WHERE id = $(id)",
        { id: result.id }
      );

      return res.status(201).json(temperature);
    } catch (error) {
      console.log(error.constraint === 'temperature_city_id_date');
      res.status(400).send('The temperature already exists for this city and date');
    }
})

//get a city by id
router.get("/cities", async (req, res) => {
  res.json(
    await db.many(`
        SELECT c.id, s.name as state, c.name as city
        FROM cities c
        INNER JOIN states s ON s.abbrev = c.state_abbrev
  `)
  );
});

router.delete("/cities/:name", async (req, res) =>{
  await db.none ('DELETE cities WHERE name = $(name)'), {name: req.params.name};

  return res.status(204).send();
});

router.delete('/states/:abbrev', async (req, res) => {
  await db.none('DELETE FROM states WHERE abbrev = $(abbrev)', {abbrev: req.params.abbrev});
  return res.status(204).send();
});

router.delete('/temperatures/:id', async (req, res) => {
  await db.none('DELETE FROM temperatures WHERE id = $(id)', {id: +req.params.id});
  return res.status(204).send();
});



module.exports = router;
