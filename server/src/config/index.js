
const packages = [
  {
    name: '1hr',
    price: 10,
    duration: 1,
    expiry: 60 * 60 * 1000,
    description: 'Perfect for quick online tasks.',
  },
  {
    name: '6hr',
    price: 50,
    duration: 6,
    expiry: 6 * 60 * 60 * 1000,
    description: 'Ideal for half-day usage with moderate browsing.',
  },
  {
    name: '12hr',
    price: 100,
    duration: 12,
    expiry: 12 * 60 * 60 * 1000,
    description: 'Great for full-day access and streaming.',
  },
];

module.exports = {
  packages,
};
