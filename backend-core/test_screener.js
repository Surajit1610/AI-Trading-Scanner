import { fetchTopMovers } from './dist/services/marketData.js';
async function test() {
    console.log("Fetching Crypto Gainers:");
    const cryptoGainers = await fetchTopMovers('crypto', 'gainers', 5);
    console.log(cryptoGainers);

    console.log("Fetching Indian Stocks Gainers:");
    const stockGainers = await fetchTopMovers('stocks', 'gainers', 5);
    console.log(stockGainers);
}
test();
//# sourceMappingURL=test_screener.js.map