/* global d3 */
import Swiper from 'swiper';
import loadData from './load-data'
import {Howl, Howler} from 'howler';
import db from './db';

const VERSION = Date.now();
let dataURL = 'https://pudding.cool/2020/04/song-memory/data.csv?version='+VERSION
let songs;

var sound = null;
let overrideAudio = ["5890","20163","12407","3077","3435","17218","2460","15866","12945","16560","15207","12976","11882","5144","7875","10437","9155","5516","6712","10441","6658","9147","2020999992","2020999991"];
let upcomingSound = null;
let uniqueSongMap = null;
let uniqueSongs = null;
let dataForPost = null;
let order = {"z":["m","x","b"],"m":["z","x","b"],"x":["z","m","b"],"b":["z","m","x"]};
let dataForPostMap = null;
let mySwiper = null;
let songOutput = [];
let startNew = true;
let dbOutput = [];
let songPlaying = null;
let songBubbles = null;
let slideOffSet = 6;
let songMap = null;
let hasExistingData = false;
let formatComma = d3.format(",");
let genSelected = null;
//let backgroundScale = d3.interpolateLab("white", "rgb(255,107,124)"); //#CFE4F9
let backgroundScale = d3.interpolateLab("white", "#83bbf3"); //#CFE4F9

let slideChangeSpeed = 350;
let fontSizeScale = d3.scaleLinear().domain([0,1]).range([48,64]);
let durationScale = d3.scaleLinear().domain([0,1]).range([1000,2000]);
let yearSelected = null;
let quizCompleted = false;
let songCount = 0;
let songDecades = 9;
let answersKey = {0:{"emoji":"🤷","text":"don&lsquo;t know it","color":"#FDDFCC"},1:{"emoji":"🤔","text":"sounds familiar","color":"#CFE4F9"},2:{"emoji":"🎵","text":"know it","color":"#E8D5CC"},3:{"emoji":"🎤","text":"singing the lyrics","color":"#FFCCD2"}};
let genLabel = {"m":"Millennials","z":"Gen Z","x":"Gen X","b":"Boomers"};
let genLabelPossessive = {"m":"millennials","z":"Gen Z&rsquo;ers","x":"Gen X&rsquo;ers","b":"boomers"};
let genLabelAge = {"m":"23&ndash;38","z":"13&ndash;22","x":"39&ndash;54","b":"55&ndash;73"};
let people = d3.select(".people").selectAll(".gen");
let decadeCustom = {9:["4448","4442","5893","2020999991"],0:["2463","1844","1231"],8:["2020999993"],7:["14583","10916","14584","11845"],6:["17218","16560"],1:["10000339"]};
//let decadeCustom = {9:["3077"],0:["2463","1844","1231"],8:["8705","7856","8683"],7:["14583","10916","14584","11845"],6:["17221","15973","17993"],1:["10000339"]};


// const emojiDivs = d3.select(".emoji-container").selectAll("div").data(d3.range(50)).enter().append("div")
//   .style("left",function(d,i){
//     return Math.random()*100+"%";
//   })
//   .style("font-size",function(d,i){
//     return fontSizeScale(Math.random())+"px";
//   });

function resize() {}

function playPauseSong(song){
  if(sound){
    sound.stop();
  }
  if(!songPlaying){
    songPlaying = song;

    let src = 'https://p.scdn.co/mp3-preview/'+song.song_url+'?cid=774b29d4f13844c495f206cafdad9c86'
    if(overrideAudio.indexOf(song.key) > -1){
      src = 'assets/audio/'+song.key+'.mp3';
    }
    sound = new Howl({
      src:[src],
      format:['mpeg'],
      autoUnlock:true,
      volume: 0.5
    });

    sound.on("end",function(){
      startNew = true;
    });
    sound.play();
  }
  else if(songPlaying.key != song.key || startNew){
    startNew = false;
    songPlaying = song;

    let src = 'https://p.scdn.co/mp3-preview/'+song.song_url+'?cid=774b29d4f13844c495f206cafdad9c86'
    if(overrideAudio.indexOf(song.key) > -1){
      src = 'assets/audio/'+song.key+'.mp3';
    }
    sound = new Howl({
      src:[src],
      format:['mpeg'],
      autoUnlock:true,
      volume: 0.5
    });

    sound.on("end",function(){
      console.log("ending");
      startNew = true;
    });
    sound.play();
  }
  else {
    startNew = true;
  }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


function changeSong(songNumber){

  console.log(songNumber);

  if(sound){
    sound.stop();
  }
  if(upcomingSound){
    upcomingSound.stop();
    sound = upcomingSound;
  }

  console.log(songPlaying);

  sound.play();
  songPlaying = songs[songNumber];

  let order = ["b","x","m","z"];

  let scale = d3.scaleQuantize().domain([0,1]).range([1,2,3,4,5,6]);
  let colorScale = d3.scaleLinear().domain([.1,.9]).range(["red","blue"]);
  let transformScale = d3.scaleLinear().domain([.1,.9]).range([10,0]);
  people.style("display",null).each(function(d,i){
    let gen = order[i];
    if(dataForPostMap.has(songPlaying.key)){
      d3.select(".people").style("display",null);
      let percent = dataForPostMap.get(songPlaying.key).percents[gen];
      d3.select(this).select(".gen-score").style("color",function(d,i){
        return colorScale(percent);
      }).text(Math.round(percent*100)+"%");

      d3.select(this).style("transform","translate(0,"+transformScale(percent)+"px)")

      d3.select(this).select(".gen-image").style("background-image",function(){
        return "url('assets/images/"+gen+"/"+scale(Math.random())+".png')"
      });
    } else {
      d3.select(".people").style("display","none");
    }
  });


  console.log(songPlaying);

  songCount = songCount + 1;
  var song = songs[songCount];
  var url = song.song_url;

  let src = 'https://p.scdn.co/mp3-preview/'+url+'?cid=774b29d4f13844c495f206cafdad9c86'
  if(overrideAudio.indexOf(song.key) > -1){
    src = 'assets/audio/'+song.key+'.mp3';
  }
  upcomingSound = new Howl({
    src:[src],
    format:['mpeg'],
    autoUnlock:true,
    volume: 0.5,
    onplayerror: function() {
      console.log("error");
      sound.once('unlock', function() {
        sound.play();
      });
    }
  });

  console.log(Howler._audioUnlocked);
}

function slideController(){
  d3.select(".start-slide").select(".red-button").on("click",function(d){

    d3.select(".memory-header").style("display","none")

    var song = uniqueSongs[0];
    var url = song.song_url;
    songPlaying = song;

    let src = 'https://p.scdn.co/mp3-preview/'+url;
    src = 'https://p.scdn.co/mp3-preview/02ee79550a6b38fc7e9f7df1e521ae639b1e2c23';

    if(overrideAudio.indexOf(song.key) > -1){
      src = 'assets/audio/'+song.key+'.mp3';
    }
    sound = new Howl({
      src:[src],
      format:['mpeg'],
      autoUnlock:true,
      volume: 0
    });

    sound.on("load",function(d){
      sound.fade(0,.5,2000);
      sound.play();
      mySwiper.slideNext();
    })

  });

  d3.select(".start-slide-2").select(".grey-button").on("click",function(d){
    mySwiper.slideNext();
  });

  d3.select(".decade-slide").select(".new-user").selectAll(".grey-button").on("click",function(d){

    let decadeSelected = d3.select(this).text().slice(2,3);

    if(decadeSelected < 8){
      people.style("display",function(d,i){
        if(i > 1){
          return "none"
        }
        return null;
      })
    }
    else if(decadeSelected == 8){
      people.style("display",function(d,i){
        if(i == 0 || i == 3){
          return "none"
        }
        return null;
      })
    }
    else if(decadeSelected > 8){
      people.style("display",function(d,i){
        if(i < 2){
          return "none"
        }
        return null;
      })
    }

    d3.select(".year-slide").selectAll(".grey-button").each(function(d,i){
      var prefix = "19"+decadeSelected;
      if(decadeSelected == 0 || decadeSelected == 1){
        var prefix = "20"+decadeSelected;
      }
      d3.select(this).text(prefix+(i));
    })
    mySwiper.slideNext(slideChangeSpeed, true);
  });

  d3.select(".decade-slide").select(".old-user").select(".old-top").selectAll(".grey-button").on("click",function(d){
    mySwiper.slideTo(slideOffSet-2, slideChangeSpeed, true);
  });

  d3.select(".decade-slide").select(".old-user").select(".old-bottom").selectAll(".grey-button").on("click",function(d){

    let decadeSelected = d3.select(this).text().slice(2,3);

    hasExistingData = false;
    dbOutput = [];
    songOutput = [];
    db.clear();
    db.setup();

    d3.select(".year-slide").selectAll(".grey-button").each(function(d,i){
      var prefix = "19"+decadeSelected;
      if(decadeSelected == 0 || decadeSelected == 1){
        var prefix = "20"+decadeSelected;
      }
      d3.select(this).text(prefix+(i));
    })
    mySwiper.slideNext(slideChangeSpeed, true);
  });

  d3.select(".year-slide").selectAll(".grey-button").on("click",function(d){
    yearSelected = d3.select(this).text();

    if(yearSelected > 1980 && yearSelected < 1997){
      people.style("display",function(d,i){
        if(i == 2){
          return null
        }
        return "none";
      })
    }
    else if(yearSelected > 1996){
      people.style("display",function(d,i){
        if(i == 3){
          return null
        }
        return "none";
      })
    }
    else if(yearSelected < 1966){
      people.style("display",function(d,i){
        if(i == 0){
          return null
        }
        return "none";
      })
    }
    else if(yearSelected > 1965 && yearSelected < 1981){
      people.style("display",function(d,i){
        if(i == 1){
          return null
        }
        return "none";
      })
    }

    if(hasExistingData){
      mySwiper.slideTo(slideOffSet-2,slideChangeSpeed, true);
    }
    else{
     var decadeSelector = d3.scaleQuantize().domain([0,1]).range([0,6,7,8,9]);
     //var decadeSelector = d3.scaleQuantize().domain([0,1]).range([8]);

      getData(decadeSelector(Math.random()));
    }
  });

  d3.select(".music-choose-slide").selectAll(".grey-button").on("click",function(d){
    getData(+d3.select(this).text().slice(-3).slice(0,1));
  })

  d3.selectAll(".options").selectAll("div").on("click",function(d,i){

    // emojiDivs.text(d3.select(this).select(".emoji").text());
    //
    // emojiDivs
    //   .transition()
    //   .duration(function(d){
    //     return durationScale(Math.random());
    //   })
    //   .ease(d3.easeLinear)
    //   .style("transform",function(d,i){
    //     return "translate(-33px,-500px)";
    //   })
    //   .style("opacity",0)
    //   .transition()
    //   .duration(0)
    //   .style("transform",function(d,i){
    //     return "translate(-33px,0px)";
    //   })
    //   .style("opacity",1)
    //   ;

    console.log(songPlaying.title+"added to dataset");

    songOutput.push({"song_url":songPlaying.song_url,"key":songPlaying.key,"artist":songPlaying.artist,"title":songPlaying.title,"text":d3.select(this).text(),"answer":i, "year":songPlaying.year});

    dbOutput.push({"key":songPlaying.key,"answer":i})

    if(d3.select(".swiper-slide-active").classed("last-song")){

      mySwiper.slideNext(slideChangeSpeed, true);

      if(sound){
        sound.stop();
      }

      d3.select(".output").transition().duration(0).style("display","block").on("end",function(d){

        d3.transition()
            .delay(100)
            .duration(1000)
            .tween("scroll", scrollTween(window.innerHeight));

        d3.select("footer").style("display","block");

      })

      function scrollTween(offset) {
        return function() {
          var i = d3.interpolateNumber(window.pageYOffset || document.documentElement.scrollTop, offset);
          return function(t) { scrollTo(0, i(t)); };
        };
      }

      quizOutput();
      updateOnCompletion();
      compareThingYouKnewMost();
      quizCompleted = true;
      hasExistingData = true;
      db.update({"year":yearSelected,"answers":dbOutput});
    }
    else {
      let colorToAdd = window.getComputedStyle(d3.select(this).node(), null).getPropertyValue("background-color");
      let textToAdd = d3.select(this).select(".emoji").text();

      songBubbles.each(function(d,i){
        if(i == (mySwiper.activeIndex - slideOffSet )){
          d3.select(this).style("background-color",colorToAdd);
          d3.select(this).append("p").attr("class","post-answer").text(textToAdd);
        }
      })
      mySwiper.slideNext(slideChangeSpeed, true);
    }
  });

  d3.selectAll(".redo-slide").selectAll(".grey-button").on("click",function(d){
    if(sound){
      sound.stop();
    }
    d3.select(".people").classed("quizzing",false);
    people.style("display","none");
    mySwiper.slideTo(slideOffSet-2, slideChangeSpeed, true);
  })
}

function getData(songDecades){

  upcomingSound = null;

  d3.selectAll(".song-decade").text(function(d){
    if(songDecades > 1){
      return "19"+songDecades+"0";
    }
    else {
      return "20"+songDecades+"0";
    }
  })

  let songsRated = songOutput.map(function(d){return d.key});

  songs = uniqueSongs.filter(function(d){
    var id = d.key;
    return d.year.slice(0,4).slice(2,3) == songDecades && songsRated.indexOf(id) == -1;
  });

  shuffle(songs);

  if(!hasExistingData){
    for (var song in decadeCustom[songDecades]){
      let customSong = decadeCustom[songDecades][song];
      songs.unshift(uniqueSongMap.get(customSong));
    }
  }

  var song = songs[0];
  songCount = 0;
  var url = song.song_url;
  songPlaying = song;

  let src = 'https://p.scdn.co/mp3-preview/'+url;

  if(overrideAudio.indexOf(song.key) > -1){
    src = 'assets/audio/'+song.key+'.mp3';
  }

  console.log(src);

  sound = new Howl({
    src:[src],
    format:['mpeg'],
    autoUnlock:true,
    volume: 0.5
  });

  sound.on("load",function(d){
    console.log("loaded");

    if(hasExistingData){
      mySwiper.slideNext(slideChangeSpeed, true);
    }
    else{
      mySwiper.slideTo(slideOffSet-1,slideChangeSpeed, true);
    }
  })
}

function init() {

  songBubbles = d3.select(".song").selectAll("div").data(d3.range(d3.selectAll(".song-quiz").size())).enter().append("div").attr("class","song-bubble");
  //
  mySwiper = new Swiper ('.swiper-container', {
      slidesPerView:1,
      simulateTouch:false,
      touchStartPreventDefault:false,
      allowTouchMove:false,
    })
  //
  mySwiper.on('slideChange', function () {
    if(mySwiper.activeIndex == slideOffSet){
      d3.select(".song").style("opacity",1);
      people.style("display",null);
      d3.select(".people").classed("quizzing",true);
    }

    else if(mySwiper.activeIndex == slideOffSet+d3.selectAll(".song-quiz").size()){
      d3.select(".song").style("opacity",0);
    }

    d3.select(".song").style("transform","translate("+(-45-(40*(mySwiper.activeIndex - slideOffSet)))+"px,0px)")

    songBubbles.each(function(d,i){
      if(i == (mySwiper.activeIndex - slideOffSet)){
        d3.select(this).classed("song-bubble-active",true);
      }
      else{
        d3.select(this).selectAll(".year-text").remove();
        d3.select(this).selectAll("svg").remove();
        d3.select(this).classed("song-bubble-active",false);
      }
    })
  })
  //
  mySwiper.on('slideChangeTransitionEnd', function () {

    if(d3.select(".swiper-slide-active").classed("loading-slide")){

      songBubbles.each(function(d,i){
        console.log("removing");
        d3.select(this).style("background-color",null);
        d3.select(this).selectAll("p").remove();
        d3.select(this).selectAll(".year-text").remove();
        d3.select(this).selectAll("svg").remove();
        d3.select(this).classed("song-bubble-active",false);
      })

      window.setTimeout(function(d){
        mySwiper.slideNext(slideChangeSpeed, true);
      },3000)
    }

    else if(d3.select(".swiper-slide-active").classed("song-quiz")){
      changeSong(songCount);



      function transition(path) {
        path.transition()
            .duration(30000)
            .ease(d3.easeLinear)
            .attrTween("stroke-dasharray", tweenDash)
            .attrTween("stroke", colorTween)
      }

      function colorTween() {
        // var l = 2*Math.PI*40;
        // var i = d3.interpolateString("0," + l, l + "," + l);
        var i = d3.interpolateHslLong("#17becf", "red");
        return function(t) {
          return i(t);
        };
      }

      function tweenDash() {
        var l = 2*Math.PI*40;
        var i = d3.interpolateString("0," + l, l + "," + l);

        return function(t) { return i(t); };
      }

      songBubbles.each(function(d,i){
        if(i == (mySwiper.activeIndex - slideOffSet)){
          d3.select(this).append("div").attr("class","year-text").text(songPlaying.year);

          d3.select(this).append("svg")
            .attr("width",90)
            .attr("height",90)
            .append("circle")
            .attr("r",40)
            .attr("cx",45)
            .attr("cy",45)
            .call(transition);
        }
      })
    }
    else if(d3.select(".swiper-slide-active").classed("start-slide-2")){
      d3.select(".people").classed("explainer",true);
      d3.select(".byline").style("display","none");
    }
    else if(d3.select(".swiper-slide-active").classed("decade-slide")){
      d3.select(".people").classed("explainer",false)
      sound.stop();
    }

  });
  //
  slideController();

  loadData([dataURL,'cleaned_data.csv']).then(result => {

    let container = d3.select(".start-slide");
    container.select(".red-button").style("display","block");
    container.select(".grey-button").style("display","none");

    uniqueSongs = result[1];
    uniqueSongMap = d3.map(result[1],function(d){
      return d.key;
    });

    setupDB();

    postAnalysis(result[0])



    if(hasExistingData){
      d3.select(".new-user-big-text").style("display","none")
    }

	}).catch(console.error);

}

function setupDB() {
  db.setup();
  const answers = db.getAnswers();
  if(answers){
    hasExistingData = true;

    yearSelected = answers["year"];
    genSelected = getGeneration(yearSelected);

    d3.select(".new-user").style("display","none")
    d3.select(".old-user").style("display","flex")
    d3.selectAll(".old-bday").text(yearSelected);

    answers["answers"].forEach(function(d){
      dbOutput.push(d);
      let songInfo = uniqueSongMap.get(d.key);
      songOutput.push({"song_url":songInfo.song_url,"key":d.key,"artist":songInfo.artist,"title":songInfo.title,"text":answersKey[d.answer].text,"answer":d.answer,"year":songInfo.year})
    })
    //remove this when staging live
    // quizOutput();
    // updateOnCompletion();
  }
}

function quizOutput(){

  d3.select(".quiz-end").selectAll("div").remove();

  let songOutputNest = d3.nest()
    .key(function(d){
      return d.answer;
    })
    .sortKeys(function(a,b){
      return +a - +b;
    })
    .entries(songOutput)

  var totalCount = songOutput.length;
  var knewCount = songOutput.filter(function(d){return +d.answer > 1}).length;

  d3.select(".know").text(knewCount);
  d3.select(".total").text(totalCount);

  let sections = d3.select(".quiz-end").selectAll("div")
    .data(songOutputNest)
    .enter()
    .append("div")
    .attr("class","quiz-end-section")
    ;

  let sectionTitle = sections.append("p")
    .attr("class","quiz-end-section-title")
    .style("background-color",function(d){
      return answersKey[d.key].color;
    })
    .html(function(d){
      return "<span class='emoji'>"+answersKey[d.key].emoji+"</span>"+answersKey[d.key].text;
    })
    ;

  let sectionItemRow = sections.append("div")
    .attr("class","quiz-end-section-items")
    .selectAll("div")
    .data(function(d){
      return d.values
    })
    .enter()
    .append("div")
    .attr("class","quiz-end-section-item")
    ;

  sectionItemRow.append("div")
    .attr("class","quiz-end-section-item-play")
    .html(function(d){
      return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 40 60" enable-background="new 0 0 100 100" xml:space="preserve" style="height: 22px;width: 21px;"><g style="-ms-transform: translate(-30px,-7px); -webkit-transform: translate(-30px,-7px); transform: translate(-30px,-7px);width: 10px;"><polygon points="51.964,33.94 38.759,43.759 30.945,43.759 30.945,56.247 38.762,56.247 51.964,66.06  "></polygon><path d="M66.906,34.21l-3.661,2.719c2.517,3.828,3.889,8.34,3.889,13.071s-1.372,9.242-3.889,13.072l3.661,2.718   c3.098-4.604,4.786-10.069,4.786-15.79S70.004,38.821,66.906,34.21"></path><path d="M56.376,42.037h-0.317c1.378,2.441,2.126,5.18,2.126,7.963c0,2.79-0.748,5.528-2.126,7.97h0.321l2.516,1.864   c1.738-2.996,2.676-6.383,2.676-9.834s-0.939-6.839-2.676-9.841L56.376,42.037z"></path></g></svg>';
    })
    .on("click",function(d){
      playPauseSong(d);
    })

  sectionItemRow.append("p")
    .attr("class","quiz-end-section-item-text")
    .html(function(d){
      return "<span class='bold'>"+d.title + "</span> by " + d.artist + ", "+d.year;
    })
}

function getGeneration(year){
  let gen = "z"
  if(year < 1966){
    gen = "b"
  }
  else if(year < 1981){
    gen = "x"
  }
  else if(year < 1997){
    gen = "m"
  }
  return gen;
}

function updateOnCompletion(){
  d3.select(".non-gen-z").style("display",function(d){
    if(genSelected == "x"){
      return "none"
    }
    return null;
  })
}

function postAnalysis(data){

  genSelected = getGeneration(yearSelected);
  delete data["columns"];
  let totalEntries = 0;

  dataForPost = [];

  for (var song in data){
    if(uniqueSongMap.has(data[song].key)){
      let songInfo = uniqueSongMap.get(data[song].key);
      //console.log(data[song].key);
      //let songYear = songMap.get(data[song].key).value.year;
      data[song].title = songInfo.title;
      data[song].artist = songInfo.artist;
      data[song].year = songInfo.year;
      data[song].song_url = songInfo.song_url;
    }
    let percents = {};
    let milValue = data[song]["m"].split("|");
    let milPercent = milValue[0]/milValue[1]

    let genZValue = data[song]["z"].split("|");
    let genZPercent = genZValue[0]/genZValue[1]

    let genXValue = data[song]["x"].split("|");
    let genXPercent = genXValue[0]/genXValue[1]

    let boomValue = data[song]["b"].split("|");
    let boomPercent = boomValue[0]/boomValue[1]
    totalEntries = totalEntries + +boomValue[1] + +genXValue[1] + +genZValue[1] + +milValue[1];
    let rawCount = +boomValue[1] + +genXValue[1] + +genZValue[1] + +milValue[1];
    let count = 0;

    if(!isNaN(milPercent)){
      count = count + 1
    }
    if(!isNaN(genZPercent)){
      count = count + 1;
    }
    if(!isNaN(genXPercent)){
      count = count + 1;
    }
    if(!isNaN(boomPercent)){
      count = count + 1;
    }
    if(count > 3){
      data[song].percents = {"z":genZPercent,"m":milPercent,"x":genXPercent,"b":boomPercent};
      data[song]["totalCount"] = rawCount;
      dataForPost.push(data[song])
    }
  }
  dataForPostMap = d3.map(dataForPost,function(d){return d.key});



  d3.select(".total-entries").text(formatComma(totalEntries));
  d3.select(".non-gen-z").style("display",function(d){
    if(genSelected == "x"){
      return "none"
    }
    return null;
  })

  // function compareThingYouKnewLeast(){
  //   let container = d3.select(".song-didnt-know-compare");
  //   let threshold = .5;
  //
  //   let songOutputFiltered  = songOutput.filter(function(d){
  //     return +d.answer < 2;
  //   })
  //
  //   let songsMatchingThreshold = [];
  //
  //   //get database percents
  //   for (var song in songOutputFiltered){
  //
  //     if(dataForPostMap.has(songOutputFiltered[song].key)){
  //
  //       let percents = dataForPostMap.get(songOutputFiltered[song].key).percents;
  //       let maxValue = null;
  //       let orderForCheck = order[genSelected];
  //
  //       for (var gen in orderForCheck){
  //         if(percents[orderForCheck[gen]] > threshold && percents[genSelected] < percents[orderForCheck[gen]]){
  //           maxValue = [orderForCheck[gen],percents[orderForCheck[gen]]];
  //           break;
  //         }
  //       }
  //
  //       if(maxValue){
  //         songOutputFiltered[song].maxValue = maxValue
  //         songOutputFiltered[song].percents = percents
  //         songsMatchingThreshold.push(songOutputFiltered[song])
  //       }
  //     }
  //   }
  //
  //
  //   // get maximum
  //   if(songsMatchingThreshold.length > 0){
  //     songsMatchingThreshold = songsMatchingThreshold.sort(function(a,b){
  //       return +b.maxValue[1] - a.maxValue[1];
  //     })
  //     var songMatch = songsMatchingThreshold[0]
  //     if(uniqueSongMap.has(songMatch.key)){
  //       let songInfo = uniqueSongMap.get(songMatch.key);
  //       //console.log(data[song].key);
  //       //let songYear = songMap.get(data[song].key).value.year;
  //       songMatch.title = songInfo.title;
  //       songMatch.artist = songInfo.artist;
  //       songMatch.year = songInfo.year;
  //
  //     }
  //
  //
  //     container.select(".song-knew").html("<span class='bold'>"+songMatch.title+"</span>"+" by "+songMatch.artist);
  //     container.select(".song-knew-percent").html(Math.round(songMatch.maxValue[1]*100)+"%");
  //     container.select(".song-knew-gen").html(genLabelPossessive[songMatch.maxValue[0]]+" (ages "+genLabelAge[songMatch.maxValue[0]]+")");
  //
  //     let barScale = d3.scaleLinear().domain([0,d3.max(Object.values(songMatch.percents).map(function(d){return 1-d;}))]).range([0,100])
  //
  //     let row = container.select(".bar-chart").selectAll("div").data(["z","m","x","b"]).enter("div").append("div").attr("class","row");
  //     row.append("p").attr("class","row-label").html(function(d){return genLabel[d]+"<span>Ages "+genLabelAge[d]+"</span>"});
  //     let rowBar = row.append("div").attr("class","row-bar").style("width",function(d){
  //         return barScale(songMatch.percents[d])+"%"
  //       })
  //       .style("background-color",function(d){
  //         return "rgba(255,107,124,"+barScale(songMatch.percents[d])/100+")"
  //       })
  //
  //     rowBar.append("p").attr("class","row-percent").html(function(d,i){
  //       if(i==0){
  //         return Math.round((songMatch.percents[d])*100)+"% <span>recognize song</span>";
  //       }
  //       return Math.round((songMatch.percents[d])*100)+"%"
  //     });
  //
  //   }
  // }

  function artistClean(artist){
    return artist.split(" featuring")[0].split(" Featuring")[0].replace(", The","");
  }

  function knowledgeHeatmap(data,text){

    d3.select(".grid-chart-container").append("p").attr("class",null).html(text)
    d3.select(".grid-chart-container").append("p").attr("class","chart-head med-text").html('Percent of people who <span class="color-recognize">recognize</span> a song, by generation.')

    let container = d3.select(".grid-chart-container").append("div").attr("class","grid-chart");

    let row = container.selectAll("div").data(data).enter().append("div").attr("class","row");
    row.append("p").attr("class","row-label").html(function(d){
      return d.title+' <span>'+artistClean(d.artist)+' '+d.year+"</span><svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' viewBox='0 19 40 40' enable-background='new 0 0 100 100' xml:space='preserve' style='height: 11px;width: 18px;'><g style='-ms-transform: translate(-30px,-7px); -webkit-transform: translate(-30px,-7px); transform: translate(-30px,-7px);width: 10px;'><polygon points='51.964,33.94 38.759,43.759 30.945,43.759 30.945,56.247 38.762,56.247 51.964,66.06  '></polygon><path d='M66.906,34.21l-3.661,2.719c2.517,3.828,3.889,8.34,3.889,13.071s-1.372,9.242-3.889,13.072l3.661,2.718   c3.098-4.604,4.786-10.069,4.786-15.79S70.004,38.821,66.906,34.21'></path><path d='M56.376,42.037h-0.317c1.378,2.441,2.126,5.18,2.126,7.963c0,2.79-0.748,5.528-2.126,7.97h0.321l2.516,1.864   c1.738-2.996,2.676-6.383,2.676-9.834s-0.939-6.839-2.676-9.841L56.376,42.037z'></path></g></svg>";
      })
      .on("click",function(d){
        playPauseSong(d)
      });

    container.insert("div",":first-child").attr("class","row").html("<div class='row-label'></div><div class='box-container'><div class='box'></div> <div class='box'></div> <div class='box'></div> <div class='box'></div> </div>")

    let box = row.append("div").attr("class","box-container").selectAll("div").data(function(d){
      var thing = Object.keys(d.percents).map(function(e){
          return [e,d.percents[e]]
        });
      return thing;
    })
    .enter()
    .append("div")
    .attr("class","box")

    box.append("div")
      .attr("class","box-height")
      .style("background-color",function(d){
        if(!d[1]){
          return "#f7f7f7";
        }
        return backgroundScale(d[1]);
      })
      .style("height",function(d){
        if(!d[1]){
          return "0px";
        }
        return Math.round(d[1]*100)+"%";
      })

    box.append("p")
      .html(function(d){
        if(d[1] || d[1] == 0){
          return Math.round(d[1]*100)+"%";
        }
        return "no data<br>yet";
      })
      .style("font-size",function(d){
        if(d[1] || d[1] == 0){
          return null;
        }
        return "10px"
      })
      .style("opacity",function(d){
        if(d[1] || d[1] == 0){
          return null;
        }
        return .6
      })
    row.each(function(d,i){
      if(i==0){

      }
    })
  }

  function findTrends(){
    let universallyRecognized = dataForPost.filter(function(d){
      return d.totalCount > 150 && d3.min(Object.values(d.percents)) > .9;
    });

    let exceptGenZ = dataForPost.filter(function(d){
      let otherMax = d3.min([d.percents.x,d.percents.m]);
      return d.totalCount > 150 && otherMax > .5 && d.percents.z < .2;
    });

    let exceptMillenials = dataForPost.filter(function(d){
      let otherMax = d3.min([d.percents.x,d.percents.b]);
      return d.totalCount > 150 && otherMax > .5 && d.percents.m < .2;
    });

    let millenials = dataForPost.filter(function(d){
      let otherMax = d3.max([d.percents.x,d.percents.b,d.percents.z]);
      return d.totalCount > 150 && otherMax < .3 && d.percents.m > otherMax*2 && d.percents.m > .4;
    });

    let genx = dataForPost.filter(function(d){
      let otherMax = d3.max([d.percents.m,d.percents.b,d.percents.z]);
      return d.totalCount > 150 && otherMax < .3 && d.percents.x > otherMax*2 && d.percents.x > .4;
    });

    let booms = dataForPost.filter(function(d){
      let otherMax = d3.max([d.percents.m,d.percents.x,d.percents.z]);
      return d.totalCount > 150 && otherMax < .3 && d.percents.b > otherMax*2 && d.percents.b > .4;
    });

    let nineties = dataForPost.filter(function(d){
      return d.totalCount > 150 && d.year.slice(2,3) == "9" && d3.max(Object.values(d.percents)) < .2;
    });

    let eighties = dataForPost.filter(function(d){
      return d.totalCount > 150 && d.year.slice(2,3) == "8" && d3.max(Object.values(d.percents)) < .2;
    });

    // let thing = dataForPost.filter(function(d){
    //   return d.year < 1965 && d3.min(Object.values(d.percents)) > .8;
    // });


    knowledgeHeatmap(exceptGenZ,"First, here are songs that did not get passed down to gen z, recognized by everyone except them.");
    knowledgeHeatmap(exceptMillenials,"Here are songs recognized by boomers and gen x, but not millennials.");
    knowledgeHeatmap(universallyRecognized,"Here is what is universally known, making for a great cross-generational wedding playlist.");
    knowledgeHeatmap(millenials,"Here are songs that are uniquely known by millennials, important cultural touchstones for the generation.");
    knowledgeHeatmap(genx,"Here is the same thing for gen x, songs uniquely known by only the generation.");
    // knowledgeHeatmap(nineties,"nineies");
    // knowledgeHeatmap(thing,"Here is the same thing for gen x, songs uniquely known by only the generation.");




      //.sort(function(a,b){return b.totalCount - a.totalCount});



  }
  findTrends();

}

function buildBarChart(songMatch,container){
  let barScale = d3.scaleLinear().domain([0,d3.max(Object.values(songMatch.percents).map(function(d){return d;}))]).range([0,100])

  container.select(".bar-chart").selectAll("div").remove();

  let row = container.select(".bar-chart").selectAll("div").data(["z","m","x","b"]).enter("div").append("div").attr("class","row")
    .style("display",function(d){
      if(isNaN(songMatch.percents[d])){
        return "none"
      }
      return null;
    });

  row.append("p").attr("class","row-label").html(function(d){return genLabel[d]+"<span>Ages "+genLabelAge[d]+"</span>"});

  let rowBar = row.append("div").attr("class","row-bar").style("width",function(d){
      return barScale(songMatch.percents[d])+"%"
    })
    .style("background-color",function(d){
      return backgroundScale(barScale(songMatch.percents[d])/100);
    })

  rowBar.append("p").attr("class","row-percent").html(function(d,i){
    if(i==0){
      return Math.round((songMatch.percents[d])*100)+"% <span>recognize it</span>";
    }
    return Math.round((songMatch.percents[d])*100)+"%"
  });
}

function buildOutList(song){

  d3.select(".compare-year").text(song.year);
  d3.selectAll(".delta").text(2020 - song.year);

  d3.selectAll(".baseline-year").text(yearSelected - (2005 - +song.year));
  let container = d3.select(".songs-that-are-old");

  if(yearSelected - (2005 - song.year) < 1960){
    d3.select(".songs-that-are-old-container").style("display","none")
  }

  let songList = container.selectAll("div").data(uniqueSongs.filter(function(d){
      return d.year == (yearSelected - (2005 - song.year));
    }).slice(0,10)).enter().append("div").attr("class","row");

  songList.append("div")
    .attr("class","quiz-end-section-item-play")
    .html(function(d){
      return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 40 60" enable-background="new 0 0 100 100" xml:space="preserve" style="height: 22px;width: 21px;"><g style="-ms-transform: translate(-30px,-7px); -webkit-transform: translate(-30px,-7px); transform: translate(-30px,-7px);width: 10px;"><polygon points="51.964,33.94 38.759,43.759 30.945,43.759 30.945,56.247 38.762,56.247 51.964,66.06  "></polygon><path d="M66.906,34.21l-3.661,2.719c2.517,3.828,3.889,8.34,3.889,13.071s-1.372,9.242-3.889,13.072l3.661,2.718   c3.098-4.604,4.786-10.069,4.786-15.79S70.004,38.821,66.906,34.21"></path><path d="M56.376,42.037h-0.317c1.378,2.441,2.126,5.18,2.126,7.963c0,2.79-0.748,5.528-2.126,7.97h0.321l2.516,1.864   c1.738-2.996,2.676-6.383,2.676-9.834s-0.939-6.839-2.676-9.841L56.376,42.037z"></path></g></svg>';
    })
    .on("click",function(d){
      playPauseSong(d)
    })
  //
  songList.append("p")
    .attr("class","quiz-end-section-item-text")
    .html(function(d){
      return "<span class='bold'>"+d.title + "</span> by " + d.artist;
    })
  //


}

function compareThingYouKnewMost(){
  let container = d3.select(".song-knew-compare");
  let threshold = .3;
  //get songs you just quizzed on
  let songOutputFiltered  = songOutput.filter(function(d){
    return +d.answer > 1;
  })

  let songsMatchingThreshold = [];

  //get database percents
  for (var song in songOutputFiltered){
    if(dataForPostMap.has(songOutputFiltered[song].key)){
      let percents = dataForPostMap.get(songOutputFiltered[song].key).percents;

      let minValue = null;
      let orderForCheck = order[genSelected];
      for (var gen in orderForCheck){
        if(percents[orderForCheck[gen]] < threshold && percents[genSelected] > percents[orderForCheck[gen]]){
          minValue = [orderForCheck[gen],percents[orderForCheck[gen]]];
          break;
        }
      }
      if(minValue){
        songOutputFiltered[song].minValue = minValue
        songOutputFiltered[song].percents = percents
        songsMatchingThreshold.push(songOutputFiltered[song])
      }
    }
  }
  //get minimum
  if(songsMatchingThreshold.length > 0){
    songsMatchingThreshold = songsMatchingThreshold.sort(function(a,b){
      return +a.minValue[1] - b.minValue[1];
    })
    var songMatch = songsMatchingThreshold[0]
    if(uniqueSongMap.has(songMatch.key)){
      let songInfo = uniqueSongMap.get(songMatch.key);
      //console.log(data[song].key);
      //let songYear = songMap.get(data[song].key).value.year;
      songMatch.title = songInfo.title;
      songMatch.artist = songInfo.artist;
      songMatch.year = songInfo.year;
    }

    container.select(".song-knew").html("<span class='bold'>"+songMatch.title+"</span>"+" by "+songMatch.artist);
    container.select(".song-knew-percent").html(Math.round((songMatch.minValue[1])*100)+"%");
    container.select(".song-knew-gen").html(genLabelPossessive[songMatch.minValue[0]]+" (ages "+genLabelAge[songMatch.minValue[0]]+")");
    buildBarChart(songMatch,container)
    buildOutList(songMatch)
  }
  else {
    container.select(".chart-head").style("display","none");
    let filteredData = dataForPost.filter(function(d){
      if(d.percents["z"] > 0 && d.percents["z"] < .6 && d.percents["m"] > .5){
        return d;
      }
    })
    if(filteredData.length > 0){
      let song = filteredData[0];
      if(uniqueSongMap.has(song.key)){
        let songInfo = uniqueSongMap.get(song.key);
        //console.log(data[song].key);
        //let songYear = songMap.get(data[song].key).value.year;
        song.title = songInfo.title;
        song.artist = songInfo.artist;
        song.year = songInfo.year;
      }
      container.select(".chart-head-alt").style("display","block");
      container.select(".chart-head-alt").select(".song-knew").html("<span class='bold'>"+song.title+"</span>"+" by "+song.artist+" ("+song.year+")");

      buildBarChart(song,container)
      buildOutList(song)
    }
  }
}

export default { init, resize };
