const axios = require("axios");
const cheerio = require("cheerio");
const R = require("ramda");
const fs = require("fs");
const counties = require("./data.json");

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

const getNames = async (lang, url) => {
  const result = await axios.get(url);
  const $ = cheerio.load(result.data);
  return {
    lang,
    result: R.uniq(
      $(".mw-parser-output > ul li > a:first-child")
        .toArray()
        .map(crawlAndGetText)
        .map(i => i.split(",")[0])
    )
  };
};

const run = async () => {
  const urls = [
    {
      url:
        "https://en.wikipedia.org/wiki/List_of_place_names_of_French_origin_in_the_United_States",
      lang: "French"
    },
    {
      url:
        "https://en.wikipedia.org/wiki/List_of_place_names_of_Spanish_origin_in_the_United_States",
      lang: "Spanish"
    },
    {
      url:
        "https://en.wikipedia.org/wiki/List_of_place_names_of_Scottish_origin_in_the_United_States",
      lang: "Scottish"
    },
    {
      url:
        "https://en.wikipedia.org/wiki/Locations_in_the_United_States_with_an_English_name",
      lang: "English"
    },
    {
      url:
        "https://en.wikipedia.org/wiki/List_of_Irish_place_names_in_other_countries#United_States",
      lang: "Irish"
    },
    // {
    //   url:
    //     "",
    //   lang: "Dutch"
    // },
    {
      url:
        "https://en.wikipedia.org/wiki/List_of_place_names_of_Native_American_origin_in_the_United_States",
      lang: "Native American"
    }
  ];

  const result = await Promise.all(
    urls.map(url => getNames(url.lang, url.url))
  );

  const germanGet = await axios.get(
    "https://en.wikipedia.org/wiki/List_of_place_names_of_German_origin_in_the_United_States"
  );
  const $ = cheerio.load(germanGet.data);
  const rs = R.uniq(
    $(".wikitable")
      .first()
      .find("tbody > tr")
      .toArray()
      .slice(1)
      .map(x => crawlAndGetText(x.children[1]))
  );

  const germanList = rs.map(y => ({ [y]: "German" }));

  const finalObj = R.mergeAll(
    R.flatten(
      result
        .map(r => {
          return r.result.map(x => {
            return { [x.replace("County", "").trim()]: r.lang };
          });
        })
        .concat(germanList)
    )
  );

  const r = fluff => R.replace(fluff, "");
  const replaceFluff = R.compose(
    R.trim,
    r("County"),
    r("Parish"),
    r("\bEast\b"),
    r("\bWest\b"),
    r("\bNorth\b"),
    r("\bSouth\b"),
    r("\bNew\b")
  );

  const nativeAmerican = R.always("Native American");

  const enrichWithEtymology = R.cond([
    [
      R.anyPass([
        R.contains("Native American"),
        R.contains("Tribe"),
        R.contains("tribe"),
        R.contains("Indians"),
        R.contains("Navajo"),
        R.contains("Apache"),
        R.contains("Choctaw"),
        R.contains("Native people"),
        R.contains("Chinook")
      ]),
      () => "Native American"
    ],
    [
      R.anyPass([
        R.contains("Civil War"),
        R.contains("civil war"),
        R.contains("confederate"),
        R.contains("Confederate")
      ]),
      () => "Civil War"
    ],
    [R.anyPass([R.contains("French"), R.contains("France")]), () => "French"],
    [R.anyPass([R.contains("German")]), () => "German"],
    [R.anyPass([R.contains("Spanish"), R.contains("Spain")]), () => "Spanish"],
    [R.anyPass([R.contains("Italian"), R.contains("Italy")]), () => "Italian"],
    [
      R.anyPass([R.contains("Dutch"), R.contains("Netherlands")]),
      () => "Dutch"
    ],
    [R.anyPass([R.contains("Swedish"), R.contains("Sweden")]), () => "Swedish"],
    [R.anyPass([R.contains("Danish"), R.contains("Denmark")]), () => "Denmark"],
    [R.anyPass([R.contains("Polish"), R.contains("Poland")]), () => "Polish"],
    [
      R.anyPass([R.contains("Norway"), R.contains("Norwegian")]),
      () => "Norwegian"
    ],
    [
      R.anyPass([
        R.contains("England"),
        R.contains("Wales"),
        R.contains("English"),
        R.contains("British"),
        R.contains("Britain"),
        R.contains("United Kingdom")
      ]),
      () => "English"
    ]

    //[R.anyPass([R.contains("American")]), () => "American"]
  ]);

  const fl = counties
    // .map(x => {
    //   return finalObj[replaceFluff(x.name)]
    //     ? {
    //         ...x,
    //         lang: finalObj[replaceFluff(x.name)]
    //       }
    //     : { ...x };
    // })
    .map(x => {
      return {
        ...x,
        lang: enrichWithEtymology(x.etymology)
      };
    });
  fs.writeFileSync("eData.json", JSON.stringify(fl));
};

run();
