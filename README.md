# Artist Search 2.0

A full-stack web application for discovering artists and their artworks using the Artsy API.

## Features

- **Artist Search**: Search for artists and view detailed information
- **User Authentication**: Secure registration and login system
- **Favorites Management**: Save and manage favorite artists
- **Artwork Gallery**: Browse artist's artworks and related information
- **Similar Artists**: Discover related artists (for authenticated users)
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

### Frontend
- Angular 17
- TypeScript
- Bootstrap 5
- RxJS

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- bcrypt for password hashing

### External APIs
- Artsy API for artist and artwork data

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Artsy API credentials

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   CLIENT_ID=your_artsy_client_id
   CLIENT_SECRET=your_artsy_client_secret
   MONGODB_URI=your_mongodb_connection_string
   SECRET_KEY=your_jwt_secret_key
   PORT=8080
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   ng serve
   ```

4. Open your browser and navigate to `http://localhost:4200`

## API Endpoints

- `GET /api/artist-search/:artist_name` - Search for artists
- `GET /api/artist-details/:artist_id` - Get artist details
- `GET /api/artworks/:artist_id` - Get artist's artworks
- `GET /api/similar-artist/:artist_id` - Get similar artists
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /me` - Get current user info
- `POST /api/add-favourite/:id` - Add artist to favorites
- `DELETE /api/remove-favorite/:id` - Remove artist from favorites
- `GET /api/favorites/:email` - Get user's favorites

## Project Structure

```
Artist Search 2.0/
├── backend/
│   ├── app.js              # Main server file
│   ├── package.json        # Backend dependencies
│   └── .env               # Environment variables (not in repo)
├── frontend/
│   ├── src/
│   │   ├── app/           # Angular components and services
│   │   ├── assets/        # Static assets
│   │   └── environments/  # Environment configurations
│   ├── angular.json       # Angular configuration
│   └── package.json       # Frontend dependencies
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes.