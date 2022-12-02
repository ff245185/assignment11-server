const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("review server is running now ");
});
app.listen(port, () => {
	console.log("port is running", port);
});
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.jf2skzr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

function verifyEmail(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).send({ message: "unauthorized access" });
	}
	const token = authHeader.split(" ")[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
		if (err) {
			return res.status(403).send({ message: "unauthorized access" });
		}
		req.decoded = decoded;
		next();
	});
}
async function run() {
	const recipesCollection = client
		.db("ReviewRecipesCollection")
		.collection("recipes");
	const reviewCollection = client
		.db("ReviewRecipesCollection")
		.collection("reviews");

	// token post
	app.post("/jwt", (req, res) => {
		const user = req.body;
		const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
			expiresIn: "20h",
		});
		res.send({ token });
	});

	// recipes post
	app.post("/recipes", async (req, res) => {
		const recipe = req.body;
		const result = await recipesCollection.insertOne(recipe);
		res.send(result);
	});

	// review post
	app.post("/review", async (req, res) => {
		const review = req.body;
		const result = await reviewCollection.insertOne(review);
		res.send(result);
	});

	// recipes get data
	app.get("/limitRecipes", async (req, res) => {
		const cursor = recipesCollection.find({});
		const limitRecipes = await cursor.sort({ _id: -1 }).limit(3).toArray();
		res.send(limitRecipes);
	});

	app.get("/recipes", async (req, res) => {
		const cursor = recipesCollection.find({});
		const recipes = await cursor.toArray();
		res.send(recipes);
	});

	app.get("/recipes/:id", async (req, res) => {
		const { id } = req.params;
		const query = { _id: ObjectId(id) };
		const recipes = await recipesCollection.findOne(query);
		res.send(recipes);
	});

	// review get data
	app.get("/review", async (req, res) => {
		const cursor = reviewCollection.find({});
		const review = await cursor.toArray();
		res.send(review);
	});

	app.get("/review/:id", async (req, res) => {
		const { id } = req.body;
		const cursor = reviewCollection.find(id);
		const result = await cursor.toArray();
		res.send(result);
	});
	app.get("/reviewOne/:id", async (req, res) => {
		const { id } = req.params;
		const query = { _id: ObjectId(id) };
		const result = await reviewCollection.findOne(query);
		res.send(result);
	});
	app.get("/myReview", verifyEmail, async (req, res) => {
		const decoded = req.decoded;
		if (decoded.email !== req.query.email) {
			res.status(403).send({ message: "unauthorized access" });
		}
		let query = {};
		if (req.query.email) {
			query = {
				email: req.query.email,
			};
		}
		const cursor = reviewCollection.find(query);
		const result = await cursor.sort({ _id: -1 }).toArray();
		res.send(result);
	});

	// update review
	app.put("/review/:id", async (req, res) => {
		const { id } = req.params;
		const query = { _id: ObjectId(id) };
		const review = req.body;
		const options = { upsert: true };
		const updateReview = {
			$set: {
				name: review.name,
				star: review.star,
				email: review.email,
				userImg: review.userImg,
				message: review.message,
				date: review.currentDate,
			},
		};
		const result = await reviewCollection.updateOne(
			query,
			updateReview,
			options
		);
		res.send(result);
	});

	// delete review
	app.delete("/review/:id", async (req, res) => {
		const { id } = req.params;
		const query = { _id: ObjectId(id) };
		const result = await reviewCollection.deleteOne(query);
		res.send(result);
	});
}
run().catch(err => {
	console.log(err);
});
