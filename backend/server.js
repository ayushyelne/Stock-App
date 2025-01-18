const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = 3000;
const { subMonths, format, addDays, isWeekend, formatISO, subDays, subYears } = require("date-fns");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 21600 });
const moment = require("moment");
const path = require('path');
require('dotenv').config();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use((req, res, next) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  next();
});

app.use(express.json());

const FINNHUB_API_KEY = "cmrb8jpr01qvmr5qbtcgcmrb8jpr01qvmr5qbtd0";
const POLYGON_API_KEY = "Ol0ilSGZgPTlSyQ8fN5anG6VF_xzrfkN";

// -----------------------------------------------------------------------
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const uri =
  "mongodb+srv://yelne:Ayush123@cluster0-ayush.ijflqnk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-Ayush";

const client = new MongoClient(uri);
let db;
let portfolioCollection;

async function main() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    db = client.db("Angular-DB");
    const walletCollection = db.collection("wallet");
    const watchlistCollection = db.collection("watchlist");
    portfolioCollection = db.collection("portfolio");

    const walletDocId = "wallet_doc_id";
    const walletDoc = await walletCollection.findOne({ _id: walletDocId });
    if (walletDoc) {
      console.log(
        "Wallet document already exists. Balance:",
        walletDoc.balance
      );
    } else {
      await walletCollection.insertOne({ _id: walletDocId, balance: 25000 });
      console.log("Wallet document created with initial balance of 25000.");
    }

    const watchlistDocId = "watchlist_doc_id";
    const watchlistDoc = await watchlistCollection.findOne({
      _id: watchlistDocId,
    });
    if (watchlistDoc) {
      console.log("Watchlist document already exists.");
    } else {
      const initialWatchlistItems = [
        {
          companyName: "Example Company",
          companyTicker: "EXMPL",
        },
      ];

      await watchlistCollection.insertOne({
        _id: watchlistDocId,
        items: initialWatchlistItems,
      });
      console.log("Watchlist document created with initial items.");
    }

    const portfolioDocId = "portfolio_doc_id";
    const portfolioDoc = await portfolioCollection.findOne({
      _id: portfolioDocId,
    });

    if (portfolioDoc) {
      console.log("Portfolio document already exists.");
    } else {
      const initialPortfolioItems = [
        {
          companyName: "Example Company",
          companyTicker: "EXMPL",
          quantity: 0,
          totalCost: 0
        },
      ];

      await portfolioCollection.insertOne({
        _id: portfolioDocId,
        items: initialPortfolioItems,
      });
      console.log("Portfolio document created with initial items.");
    }
  } catch (e) {
    console.error("Error connecting to MongoDB: ", e);
  } finally {
  }
}

main().catch(console.error);

app.post("/api/watchlist", async (req, res) => {
  const { companyName, companyTicker } = req.body;
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    const watchlistCollection = db.collection("watchlist");
    await watchlistCollection.updateOne(
      { _id: "watchlist_doc_id" },
      { $addToSet: { items: { companyName, companyTicker } } },
      { upsert: true }
    );
    res.status(200).json({ message: "Added to watchlist successfully" });
  } catch (error) {
    console.error("Failed to add to watchlist:", error);
    res.status(500).json({ message: "Failed to add to watchlist" });
  }
});

app.get("/api/watchlist", async (req, res) => {
  try {
    const watchlistCollection = db.collection("watchlist");
    const watchlistDoc = await watchlistCollection.findOne({
      _id: "watchlist_doc_id",
    });

    if (!watchlistDoc) {
      return res.status(404).json({ message: "Watchlist not found" });
    }

    res.json(watchlistDoc.items);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    res.status(500).json({ message: "Failed to fetch watchlist" });
  }
});

app.delete("/api/watchlist/:companyTicker", async (req, res) => {
  const { companyTicker } = req.params;
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    const watchlistCollection = db.collection("watchlist");
    await watchlistCollection.updateOne(
      { _id: "watchlist_doc_id" },
      { $pull: { items: { companyTicker } } }
    );
    res.status(200).json({ message: "Removed from watchlist successfully" });
  } catch (error) {
    console.error("Failed to remove from watchlist:", error);
    res.status(500).json({ message: "Failed to remove from watchlist" });
  }
});

app.post('/api/update-favorites-order', async (req, res) => {
  const { orderedTickers } = req.body;

  try {
      const watchlistCollection = db.collection('watchlist');
      const watchlistDocId = "watchlist_doc_id"; 

      const watchlistDoc = await watchlistCollection.findOne({ _id: watchlistDocId });
      if (!watchlistDoc) {
          return res.status(404).json({ message: "Watchlist not found" });
      }

      const reorderedItems = orderedTickers.map(ticker => 
          watchlistDoc.items.find(item => item.companyTicker === ticker)
      ).filter(item => item !== undefined); 

      await watchlistCollection.updateOne(
          { _id: watchlistDocId },
          { $set: { items: reorderedItems } }
      );

      res.status(200).json({ message: "Favorites order updated successfully" });
  } catch (error) {
      console.error("Failed to update favorites order:", error);
      res.status(500).json({ message: "Failed to update favorites order", error });
  }
});

app.get("/api/wallet", async (req, res) => {
  try {
    const walletCollection = db.collection("wallet");
    const walletDocId = "wallet_doc_id";
    const walletDoc = await walletCollection.findOne({ _id: walletDocId });

    if (!walletDoc) {
      return res.status(404).send("Wallet not found");
    }

    res.json(walletDoc);
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ message: "Failed to fetch wallet" });
  }
});

app.post("/api/wallet/update", async (req, res) => {
  try {
    const { amount } = req.body; 
    if (typeof amount !== "number") {
      return res.status(400).send("Invalid amount value");
    }

    const walletCollection = db.collection("wallet");
    const walletDocId = "wallet_doc_id";
    console.log("Amount received:", amount);
    console.log("Type of amount:", typeof amount);

    const result = await walletCollection.updateOne(
      { _id: walletDocId },
      { $inc: { balance: +amount } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send("Failed to update wallet");
    }

    res.json({ message: "Wallet balance updated successfully" });
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    res.status(500).json({ message: "Failed to update wallet balance" });
  }
});

app.post("/api/portfolio", async (req, res) => {
  const { companyName, companyTicker, quantity, totalCost } = req.body;

  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const portfolioCollection = db.collection("portfolio");
    const portfolioDocId = "portfolio_doc_id";

    const portfolioDoc = await portfolioCollection.findOne({ _id: portfolioDocId });
    const itemIndex = portfolioDoc.items.findIndex(item => item.companyTicker === companyTicker);

    if (itemIndex > -1) {
      const existingItem = portfolioDoc.items[itemIndex];
      const updatedQuantity = existingItem.quantity + quantity;
      const updatedTotalCost = existingItem.totalCost + totalCost;

      await portfolioCollection.updateOne(
        { _id: portfolioDocId, "items.companyTicker": companyTicker },
        {
          $set: {
            "items.$.quantity": updatedQuantity,
            "items.$.totalCost": updatedTotalCost
          }
        }
      );
    } else {
      await portfolioCollection.updateOne(
        { _id: portfolioDocId },
        { $push: { items: { companyName, companyTicker, quantity, totalCost } } },
        { upsert: true }
      );
    }

    res.status(200).json({ message: "Portfolio updated successfully" });
  } catch (error) {
    console.error("Failed to update portfolio:", error);
    res.status(500).json({ message: "Failed to update portfolio", error });
  }
});


app.get("/api/portfolio", async (req, res) => {
  try {
    const portfolioDocId = "portfolio_doc_id";
    const portfolioDoc = await portfolioCollection.findOne({
      _id: portfolioDocId,
    });

    if (!portfolioDoc) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json(portfolioDoc.items); 
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ message: "Failed to fetch portfolio", error });
  }
});

app.get("/api/portfolio/:ticker", async (req, res) => {
  try {
    const { ticker } = req.params;
    const portfolioDocId = "portfolio_doc_id";
    const portfolioDoc = await portfolioCollection.findOne({
      _id: portfolioDocId,
      'items.companyTicker': ticker
    });
    
    if (!portfolioDoc) {
      return res.status(404).json({ message: "Stock not found in portfolio" });
    }
    
    const item = portfolioDoc.items.find(item => item.companyTicker === ticker);
    res.json(item); 
  } catch (error) {
    console.error("Error fetching portfolio item:", error);
    res.status(500).json({ message: "Failed to fetch portfolio item", error });
  }
});

app.post('/api/portfolio/sell', async (req, res) => {
  const { companyTicker, quantityToSell, totalRevenue } = req.body;

  try {
    const portfolioCollection = db.collection('portfolio');
    const portfolioDocId = "portfolio_doc_id";
    const portfolioDoc = await portfolioCollection.findOne({ _id: portfolioDocId });
    if (!portfolioDoc) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    const stockIndex = portfolioDoc.items.findIndex(item => item.companyTicker === companyTicker);
    if (stockIndex === -1 || portfolioDoc.items[stockIndex].quantity < quantityToSell) {
      return res.status(400).json({ message: "Cannot sell more stocks than owned" });
    }

    portfolioDoc.items[stockIndex].quantity -= quantityToSell;
    portfolioDoc.items[stockIndex].totalCost -= totalRevenue;

    if (portfolioDoc.items[stockIndex].quantity === 0) {
      portfolioDoc.items.splice(stockIndex, 1);
    }

    await portfolioCollection.updateOne({ _id: portfolioDoc._id }, { $set: { items: portfolioDoc.items } });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to sell stocks:", error);
    res.status(500).json({ message: "Failed to sell stocks", error });
  }
});

app.post('/api/update-portfolio-order', async (req, res) => {
  const { orderedTickers } = req.body;

  try {
      const portfolioCollection = db.collection('portfolio');
      const portfolioDocId = "portfolio_doc_id"; 

      const portfolioDoc = await portfolioCollection.findOne({ _id: portfolioDocId });
      if (!portfolioDoc) {
          return res.status(404).json({ message: "Portfolio not found" });
      }

      const reorderedItems = orderedTickers.map(ticker =>
          portfolioDoc.items.find(item => item.companyTicker === ticker)
      ).filter(item => item !== undefined);

      await portfolioCollection.updateOne(
          { _id: portfolioDocId },
          { $set: { items: reorderedItems } }
      );

      res.status(200).json({ message: "Portfolio order updated successfully" });
  } catch (error) {
      console.error("Failed to update portfolio order:", error);
      res.status(500).json({ message: "Failed to update portfolio order", error });
  }
});


// --------------------------------------------------------------------------------------------------------

app.get("/search/home", (req, res) => {
  res.send("Redirected to Home Search");
});

app.get("/api/search/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/api/company-profile/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/api/company-news/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  const to = new Date().toISOString().split("T")[0];
  const from = new Date();
  from.setMonth(from.getMonth() - 6);
  const formattedFrom = from.toISOString().split("T")[0];

  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${formattedFrom}&to=${to}&token=${FINNHUB_API_KEY}`
    );
    const newsWithImages = response.data
      .filter((item) => item.image)
      .slice(0, 20);
    res.json(newsWithImages);
  } catch (error) {
    console.error("Error fetching company news:", error);
    res.status(500).send("Failed to retrieve company news.");
  }
});

app.get("/api/insider-sentiment/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  const from = "2022-01-01";
  const to = new Date().toISOString().split("T")[0];

  const url = `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${ticker}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Failed to fetch insider sentiment:", error);
    res.status(500).send("Failed to retrieve insider sentiment.");
  }
});

app.get("/api/company-peers/:ticker", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase(); 
  const url = `https://finnhub.io/api/v1/stock/peers?symbol=${ticker}&token=${FINNHUB_API_KEY}`;

  try {
    const response = await axios.get(url);
    const filteredPeers = response.data.filter(
      (peer) => !peer.includes(".") && peer.toUpperCase() !== ticker
    );
    res.json(filteredPeers);
  } catch (error) {
    console.error("Failed to fetch company peers:", error);
    res.status(500).send("Failed to retrieve company peers.");
  }
});

app.get("/api/recommendation-trends/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${FINNHUB_API_KEY}`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Failed to fetch recommendation trends:", error);
    res.status(500).send("Failed to retrieve recommendation trends.");
  }
});


app.get("/api/autocomplete/:query", async (req, res) => {
  const { query } = req.params;
  const url = `https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`;

  try {
    const response = await axios.get(url);
    const filteredResults = response.data.result.filter(
      (item) => item.type === "Common Stock" && !item.symbol.includes(".")
    );
    res.json(filteredResults);
  } catch (error) {
    console.error("Failed to fetch autocomplete data:", error);
    res.status(500).send("Failed to retrieve autocomplete data.");
  }
});

app.get("/api/company-earnings/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const url = `https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&token=${FINNHUB_API_KEY}`;

  try {
    const response = await axios.get(url);
    console.log("Finnhub raw response:", response.data);

    if (!Array.isArray(response.data) || response.data.length === 0) {
      return res.status(404).send("No earnings data found.");
    }

    const data = response.data.map((earning) => ({
      Actual: earning.actual !== null ? earning.actual : 0,
      Estimate: earning.estimate !== null ? earning.estimate : 0,
      Period: earning.period,
      Surprise: earning.surprise !== null ? earning.surprise : 0,
      SurprisePercent:
        earning.surprisePercent !== null ? earning.surprisePercent : 0,
      Symbol: earning.symbol,
    }));
    res.json(data);
  } catch (error) {
    console.error("Failed to fetch company earnings:", error);
    res.status(500).send("Failed to retrieve company earnings.");
  }
});

// app.get("/api/historical-data/:ticker", async (req, res) => {
//   const { ticker } = req.params;
//   const uppercaseTicker = ticker.toUpperCase();

//   const cacheKey = `historicalData-${uppercaseTicker}`;
//   const cachedData = myCache.get(cacheKey);

//   if (cachedData) {
//     console.log("Serving from cache");
//     return res.json(cachedData);
//   }

//   const from = formatISO(subYears(new Date(), 2), {representation: 'date'});
//   const to = formatISO(new Date(), {representation: 'date'})

//   const url = `https://api.polygon.io/v2/aggs/ticker/${uppercaseTicker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`;

//   try {
//     const response = await axios.get(url);
//     if (response.data && response.data.results) {
//       const formattedData = response.data.results.map((item) => ({
//         c: item.c,
//         h: item.h,
//         l: item.l,
//         n: item.n,
//         o: item.o,
//         t: item.t,
//         v: item.v,
//         vw: item.vw,
//       }));

//       myCache.set(cacheKey, formattedData);

//       res.json(formattedData);
//     } else {
//       res.status(404).send("No data found for the given ticker.");
//     }
//   } catch (error) {
//     console.error(
//       "Error fetching historical data:",
//       error.response ? error.response.data : error.message
//     );
//     res.status(500).send("Failed to retrieve historical data.");
//   }
// });

app.get("/api/historical-data/:ticker", async (req, res) => {
  const symbol = req.params.ticker.toUpperCase();
  const from = formatISO(subMonths(new Date(), 6), { representation: 'date' });
  const to = formatISO(new Date(), { representation: 'date' });

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`;

  try {
      const response = await axios.get(url);
      const { results } = response.data;

      // Format data for HighCharts
      const chartData = {
          stockPrices: results.map(({ t, o, h, l, c, v, vw }) => ({
              time: t,
              open: o,
              high: h,
              low: l,
              close: c,
              volume: v,
              volumeWeightedAverage: vw
          })),
      };

      res.json(chartData);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching stock data', error: error.message });
  }
});

// app.get("/api/daily-data/:ticker", async (req, res) => {
//   const { ticker } = req.params;
//   const uppercaseTicker = ticker.toUpperCase();

//   // Determine if today is a weekend (market closed)
//   const today = moment();
//   const isWeekend = today.isoWeekday() > 5;

//   let fromDate, toDate;

//   if (isWeekend) {
//     // Market is closed today, find the last weekday
//     fromDate = today.clone().subtract(1, 'days');
//     while (fromDate.isoWeekday() > 5) { // Move back to the previous Friday
//       fromDate.subtract(1, 'days');
//     }
//     toDate = fromDate.clone(); // Since the market is closed, from and to dates will be the same
//   } else {
//     // Market is open, set from date to yesterday and to date to today
//     fromDate = today.clone().subtract(1, 'days');
//     toDate = today;
//   }

//   const formattedFromDate = fromDate.format("YYYY-MM-DD");
//   const formattedToDate = toDate.format("YYYY-MM-DD");

//   const url = `https://api.polygon.io/v2/aggs/ticker/${uppercaseTicker}/range/1/hour/${formattedFromDate}/${formattedToDate}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`;

//   try {
//     const response = await axios.get(url);
//     if (response.data && response.data.results) {
//       res.json(response.data.results);
//     } else {
//       res.status(404).send("No data found for the given ticker.");
//     }
//   } catch (error) {
//     console.error("Error fetching historical data:", error);
//     res.status(500).send("Failed to retrieve historical data.");
//   }
// });

// app.get("/api/daily-data/:ticker", async (req, res) => {
//   const { ticker } = req.params;
//   const uppercaseTicker = ticker.toUpperCase();

//   const today = moment();
//   const isWeekend = today.isoWeekday() > 5;

//   let fromDate, toDate;

//   if (isWeekend) {
//     fromDate = today.clone().subtract(1, "days");
//     while (fromDate.isoWeekday() > 5) {
//       fromDate.subtract(1, "days");
//     }
//     toDate = fromDate.clone();
//   } else {
//     fromDate = today.clone().subtract(1, "days");
//     toDate = today;
//   }

//   const formattedFromDate = fromDate.format("YYYY-MM-DD");
//   const formattedToDate = toDate.format("YYYY-MM-DD");

//   const url = `https://api.polygon.io/v2/aggs/ticker/${uppercaseTicker}/range/1/hour/${formattedFromDate}/${formattedToDate}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`;

//   try {
//     const response = await axios.get(url);
//     if (response.data && response.data.results) {
//       const chartData = response.data.results.map((item) => ({
//         // date: moment(item.t).format("YYYY-MM-DD"),
//         date: item.t,
//         closePrice: item.c,
//         openPrice: item.o,
//       }));

//       res.json(chartData);
//     } else {
//       res.status(404).send("No data found for the given ticker.");
//     }
//   } catch (error) {
//     console.error("Error fetching historical data:", error);
//     res.status(500).send("Failed to retrieve historical data.");
//   }
// });

app.get("/api/daily-data/:ticker", async (req, res) => {
  const symbol = req.params.ticker.toUpperCase();
  const from = formatISO(subDays(new Date(), 5), { representation: "date" });
  const to = formatISO(new Date(), { representation: "date" });

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/hour/${from}/${to}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`;

  try {
    const response = await axios.get(url);
    if (response.data && response.data.results) {
      const { results } = response.data;
      const chartData = {
        stockPrices: results.map(({ t, c }) => [t, c]),
        volumes: results.map(({ t, v }) => [t, v]),
      };
      res.json(chartData);
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching stock data", error: error.message });
  }
});

app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);

app.use(express.static(path.join(__dirname, 'Assignment-3-angular/dist/assignment-3-angular')));
