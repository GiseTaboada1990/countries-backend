const { Router } = require('express');
const axios = require('axios')
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const {Country, Activity} = require('../db')
const {Op}= require('sequelize')


const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036fÅ]/g, "");
  } 
  
const countriesDb=async()=>{
        const copia =  await axios.get("https://restcountries.com/v3/all")
        await copia.data.map((el) => {
            Country.findOrCreate({
                where: { id: el.cca3 },
                defaults: {
                    id: el.cca3,
                    name: removeAccents(el.name.common),
                    flag: el.flags[0],
                    continents: el.continents[0],
                    capital: el.capital,
                    subregion: el.subregion || 'has no subregion',
                    population: el.population,
                    area: el.area
                }
            })
        });
        const data = await Country.findAll({
            order:[['name',"ASC"]],
            include:{
            model: Activity,
            attributes: ['name']
        }
    })
        return data;
}
router.get('/countries', async (req, res) => { 
    const { name} = req.query;
    try {
        if (name) {
            let nameDb = await Country.findAll(
                {
                    where: { name: { [Op.iLike]: `%${name}%` } },
                    include: Activity
                })
               
                res.status(201).json(nameDb)
                
        } else {
            const data = await countriesDb()
            res.status(200).json(data)
        }
    } catch (error) {
        res.status(404).json(error)
    }
})
router.post('/activities', async (req, res) => {
    try{ 
    const {
        name,
        country,
        duration,
        difficulty,
        season,
    } = req.body
        const [newActivity, created] = await Activity.findOrCreate({
            where: {name},
            defaults:{
                difficulty,
                duration,
                season,
            },
    })

        const countryFind = await Country.findAll({ where: { name: { [Op.or]: country } } })
        await newActivity.addCountry(countryFind)
        !created ? res.status(200).json('The activity has already been created for these countries')
        :res.status(201).json(newActivity)
    } catch (error) {
        console.log(error)
      res.status(400).json(error)
    }
})
router.get('/countries/:id', async(req, res)=>{
    const idCountry= req.params.id
    const idCountryM = idCountry.toUpperCase()
            try {
                if (idCountryM) {
                    let country = await Country.findByPk(String(idCountryM),
                    {include: Activity});
                    country?
                    res.status(200).json(country):
                    res.status(400).send('not found')
                  }
            } catch (error) {
                console.log(error)
                res.status(404).json(error)
            }
})

router.get('/activities', async (req, res) => {
    
    const { name} = req.query;
    try {
        if (name) {
            let nameDb = await Activity.findAll(
                {
                    where: { name: { [Op.iLike]: `%${name}%`}},
                    include: Country
                })
                res.status(200).json(nameDb)
        }
        else {
            const data = await Activity.findAll({
                include: {
                    model: Country,
                    attributes: ['name']
                }
            })
            res.status(200).json(data)
        }
    } catch (error) {
        res.status(404).json(error)
    }
})
router.delete('/activities/:id', async(req, res)=>{
    const {id} = req.params;
    try {
        let actDb2 = await Activity.destroy({
            where: {ID:id}
        });
        res.status(200).json(actDb2)
    } catch (err) {
        res.status(404).json(err)
    }
})
router.get('/activities/:ID', async(req, res)=>{
    const ID= req.params.ID
            try {
                if (ID) {
                    let acty = await Activity.findByPk((ID),
                    {include: Country});
                    acty?
                    res.status(200).json(acty):
                    res.status(400).send('not found')
                  }
            } catch (error) {
                console.log(error)
                res.status(404).json(error)
            }
})
router.put('/activities/:ID', async (req, res)=>{
    const {ID} = req.params
    const { name,season, difficulty, duration, country} = req.body
    try {
       
        const activityUpdated = await Activity.findOne({ where: { ID }, include: Country })
        
        const oldCountries = activityUpdated.countries.map(c => c.dataValues.id)
       
        await activityUpdated.removeCountries(oldCountries)
       
        const countriesDB = await Country.findAll({ where: { name: { [Op.or]: country } } })

        countriesDB.forEach( async ({ dataValues }) => await activityUpdated.addCountry(dataValues.id))

        activityUpdated.set({
            name,
            season,
            difficulty,
            duration
        })

        await activityUpdated.save()

        res.status(200).send(`Activities "${name}" updated successfully`)
       
    } catch (error) { 
        res.send(error.message)
    }
})
module.exports = router;
