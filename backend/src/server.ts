import express from 'express';
import testRoutes from './interfaces/routes/testRoutes';
import userRoutes from './interfaces/routes/userRoutes';


const app = express();
app.use(express.json());

app.use('/api', testRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});