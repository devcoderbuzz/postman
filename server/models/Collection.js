import { DataTypes } from 'sequelize';

export const createCollectionModel = (sequelize) => {
  return sequelize.define('Collection', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    projectId: {
      type: DataTypes.STRING,
      defaultValue: 'default'
    },
    requests: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  });
};
