import express, { Request, Response, NextFunction } from 'express';
import testRoutes from './interfaces/routes/testRoutes';
import userRoutes from './interfaces/routes/userRoutes';
import pdfExtractRoutes from './interfaces/routes/pdfExtractRoutes';

const app = express();
app.use(express.json());

app.use('/api', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pdf', pdfExtractRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});