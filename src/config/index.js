const packages = [
  {
    name: "trial",
    price: 0,
    duration: 0.5, // duration in hours
    description: "Free trial for 30 minutes.",
  },
  {
    name: "1hr",
    price: 10,
    duration: 1, // duration in hours
    description: "Perfect for quick online tasks.",
  },
  {
    name: "6hr",
    price: 50,
    duration: 6,
    description: "Ideal for half-day usage with moderate browsing.",
  },
  {
    name: "12hr",
    price: 100,
    duration: 12,
    description: "Great for full-day access and streaming.",
  },
];

module.exports = {
  packages,
};
