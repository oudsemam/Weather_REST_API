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
router.post("/states", async (req, res) => {
  try {
    const exisiting = await db.one ('SELECT abbrev, name FROM states WHERE abbrev = $(abbrev)', {abbrev: req.body.abbrev});
    if(exisiting){
      return res.status(400).send('te state already exists')
    }
        await db.none('INSERT INTO states (abbrev, name) VALUES ($(abbrev), $(name))', {
            abbrev: req.body.abbrev,
            name: req.body.name
        });

        const state = await db.one('SELECT abbrev, name FROM states WHERE abbrev = $(abbrev)', {abbrev: req.body.abbrev});

        res.status(201).json(state);
    } catch (ex) {
        console.log (ex);
        res.status(500).send(ex);
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
    await db.none(
      "INSERT INTO cities (state_abbrev, name, climate) VALUES ($(state_abbrev), $(name), $(climate))",
      {
        state_abbrev: req.body.state_abbrev,
        name: req.body.name,
        climate: req.body.climate
      }
    );

    const city = await db.one(
      "SELECT state_abbrev, name FROM states WHERE state_abbrev = $(state_abbrev)",
      { state_abbrev: req.body.abbrev }
    );

    res.status(201).json(city);
  } catch (ex) {
    console.log(ex);
    res.status(500).send(ex);
  }
});

router.get("/temperature", async (req, res)=> {
  res.json(
    await db.manyOrNone('')
  )
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

module.exports = router;
