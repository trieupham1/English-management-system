const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

let gfs;

const connectGridFS = () => {
  const conn = mongoose.connection;
  
  conn.once('open', () => {
    // Initialize GridFS
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('materials');
    console.log('GridFS initialized');
  });
};

const getGridFS = () => {
  if (!gfs) {
    throw new Error('GridFS not initialized');
  }
  return gfs;
};

module.exports = { connectGridFS, getGridFS };