const express = require("express");
const movies = require("./movies.json");
const crypto = require("node:crypto");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

const app = express();

// Middleware para POST
app.use(express.json());

app.disable("x-powered-by");

const port = process.env.PORT ?? 3000;

// Configuracion de CORS
const ACCEPTED_ORIGINS = [
	"http://localhost:8080",
	"http://localhost:1234",
	"http://localhost:movies.com",
];

// Endpoint que muestra todas las peliculas
app.get("/movies", (req, res) => {
	const origin = req.header("origin");
	if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
		res.header("Access-Control-Allow-Origin", origin);
	}
	const { genre } = req.query;
	if (genre) {
		const filteredMovies = movies.filter((movie) =>
			movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
		);
		return res.json(filteredMovies);
	}
	res.json(movies);
});

// Endpoint que muestra peliculas por sua ID
app.get("/movies/:id", (req, res) => {
	// Path to  regexp
	const { id } = req.params;
	const movie = movies.find((movie) => movie.id === id);
	if (movie) return res.json(movie);
	res.status(404).json({ message: "Movie not found" });
});

// Endpoint para crear una pelicula
app.post("/movies", (req, res) => {
	const result = validateMovie(req.body);

	if (result.error) {
		return res
			.status(400)
			.json({ error: JSON.parse(result.error.message) });
	}

	const newMovie = {
		id: crypto.randomUUID(), // uuid v4
		...result.data,
	};
	// No seria REST, por que guardamos el estado de la aplicacion en memoria
	movies.push(newMovie);
	res.status(201).json(newMovie); // Actualizar cache del cleinte
});

app.patch("/movies/:id", (req, res) => {
	const result = validatePartialMovie(req.body);

	if (!result.success)
		return res
			.status(400)
			.json({ error: JSON.parse(result.error.message) });

	const { id } = req.params;
	const movieIndex = movies.findIndex((movie) => movie.id === id);

	if (movieIndex === -1)
		return res.status(404).json({ message: "Movie not found" });

	const updateMovie = {
		...movies[movieIndex],
		...result.data,
	};

	movies[movieIndex] = updateMovie;

	return res.json(updateMovie);
});

// Endpoint para eliminar una pelicula
app.delete("/movies/:id", (req, res) => {
	const origin = req.header("origin");
	if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
		res.header("Access-Control-Allow-Origin", origin);
	}
	const { id } = req.params;
	const movieIndex = movies.findIndex((movie) => movie.id === id);

	if (movieIndex === -1)
		return res.status(404).json({ message: "Movie not found" });

	movies.splice(movieIndex, 1);

	return res.json({ message: "Movie deleted" });
});

app.options("/movies/:id", (req, res) => {
	const origin = req.header("origin");

	if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
		res.header("Access-Control-Allow-Origin", origin);
		res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
	}
	res.send(200);
});

app.listen(port, () => {
	console.log("Server corriendo en puerto: ", port);
});
