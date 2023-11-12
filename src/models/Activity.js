const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('activity', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    ID: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    season: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.INTEGER,
        validate:{min:1,max:5},
      allowNull: false,
    },
  }, {timestamps: false});
}; 