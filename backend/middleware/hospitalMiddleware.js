import { Hospital } from '../models/Hospital.js';
import { runWithHospitalContext } from '../utils/asyncLocalStorage.js';
import cookie from 'cookie';

export const identifyHospital = async (req, res, next) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  const hospitalId = cookies?.hospitalId;
  if (!hospitalId) {
    return res.status(400).json({ error: 'hospital not specified' });
  }

  try {
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    runWithHospitalContext(hospital._id, () => {
      req.hospital = hospital._id;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: 'Error identifying hospital' });
  }
};

export const identifyHospitalFromBody = async (req, res, next) => {
  const { hospitalId } = req.body;
  if (!hospitalId) {
    return res.status(400).json({ error: 'Hospital ID not provided in request body' });
  }

  try {
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    runWithHospitalContext(hospital._id, () => {
      req.hospital = hospital._id;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: 'Error identifying hospital' });
  }
};