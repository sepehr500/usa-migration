const axios = require("axios");
const moment = require("moment");
const STATES = require("./states");
const FIPS = require("./fips");
const cheerio = require("cheerio");
const fs = require("fs");

const licenceParse = (fipsCode, state, row) => {
  return {
    state,
    name: crawlAndGetText(row.children[1]),
    fips: fipsCode + crawlAndGetText(row.children[3]),
    countySeat: crawlAndGetText(row.children[5]),
    established: moment(crawlAndGetText(row.children[9])).year() + 1,
    etymology: crawlAndGetText(row.children[13])
  };
};

const flatten = ar => [].concat.apply([], ar);
const crawlAndGetText = nd => {
  if (nd.data) {
    return nd.data;
  }
  if (nd.children) {
    return flatten(nd.children.map(x => crawlAndGetText(x)))
      .join("")
      .replace(/(\r\n|\n|\r)/gm, "");
  }
};

const run = async () => {
  //   console.log(moment("1-10-2002"));
  //   const time = moment("1797");
  const finalArray = STATES.map(async state => {
    try {
      //   console.log(state.split(" ").join("_"));

      const fipsCode = FIPS[state];
      const result = await axios.get(
        `https://en.wikipedia.org/wiki/List_of_counties_in_${state
          .split(" ")
          .join("_")}`
      );
      const $ = cheerio.load(result.data);
      const rs = $(".wikitable")
        .first()
        .find("tbody > tr")
        .toArray()
        .slice(1)
        .map(x => {
          const year = moment(crawlAndGetText(x.children[7])).year() + 1;
          if (state === "Iowa") {
            return {
              state,
              name: crawlAndGetText(x.children[1]),
              fips: fipsCode + crawlAndGetText(x.children[3]),
              countySeat: crawlAndGetText(x.children[5]),
              established: moment(crawlAndGetText(x.children[9])).year() + 1,
              etymology: crawlAndGetText(x.children[13])
            };
          }
          if (state === "Alabama") {
            return licenceParse(fipsCode, state, x);
          }
          if (year === 2002 || year.toString().length !== 4) {
            return licenceParse(fipsCode, state, x);
          }
          return {
            state,
            name: crawlAndGetText(x.children[1]),
            fips: fipsCode + crawlAndGetText(x.children[3]),
            countySeat: crawlAndGetText(x.children[5]),
            established: year,
            etymology: crawlAndGetText(x.children[11])
          };
        });
      return rs;
    } catch (error) {
      console.log(state + "FAILED");
    }
  });
  const result = await Promise.all(finalArray);
  fs.writeFileSync("data.json", JSON.stringify(flatten(result)));
};

run();
