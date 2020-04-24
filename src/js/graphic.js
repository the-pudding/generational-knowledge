/* global d3 */
import Swiper from 'swiper';
import loadData from './load-data'
import {Howl, Howler} from 'howler';
import db from './db';


let songs;
var sound = null;
let mySwiper = null;
let songOutput = [];
let dbOutput = [];
let songPlaying = null;
let songBubbles = null;
let slideOffSet = 4;
let songMap = null;
let slideChangeSpeed = 350;
let fontSizeScale = d3.scaleLinear().domain([0,1]).range([48,64]);
let durationScale = d3.scaleLinear().domain([0,1]).range([1000,2000]);
let yearSelected = null;
let quizCompleted = false;

const emojiDivs = d3.select(".emoji-container").selectAll("div").data(d3.range(50)).enter().append("div")
  .style("left",function(d,i){
    return Math.random()*100+"%";
  })
  .style("font-size",function(d,i){
    return fontSizeScale(Math.random())+"px";
  });

function resize() {}

function changeSong(){
  if(sound){
    sound.stop();
  }
  var song = songs[Math.round(songs.length*Math.random())];
  var url = song.song_url;
  songPlaying = song;

  sound = new Howl({
    src: ['https://p.scdn.co/mp3-preview/'+url+'.mp3'],
    autoUnlock:true,
    onplayerror: function() {
      console.log("error");
      sound.once('unlock', function() {
        sound.play();
      });
    }
  });
  sound.play();
  console.log(Howler._audioUnlocked);
}

function slideController(){
  d3.select(".start-slide").select(".red-button").on("click",function(d){

    var song = songs[Math.round(songs.length*Math.random())];
    var url = song.song_url;
    songPlaying = song;

    sound = new Howl({
      src: ['https://p.scdn.co/mp3-preview/'+url+'.mp3'],
      autoUnlock:true,
    });
    mySwiper.slideNext();
  });

  d3.select(".decade-slide").selectAll(".grey-button").on("click",function(d){
    let decadeSelected = d3.select(this).text().slice(2,3);

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
    mySwiper.slideNext(slideChangeSpeed, true);
  });

  d3.selectAll(".options").selectAll("div").on("click",function(d,i){

    emojiDivs.text(d3.select(this).select(".emoji").text());

    emojiDivs
      .transition()
      .duration(function(d){
        return durationScale(Math.random());
      })
      .ease(d3.easeLinear)
      .style("transform",function(d,i){
        return "translate(-33px,-500px)";
      })
      .style("opacity",0)
      .transition()
      .duration(0)
      .style("transform",function(d,i){
        return "translate(-33px,0px)";
      })
      .style("opacity",1)
      ;

    songOutput.push([songPlaying.artist+", "+songPlaying.title,d3.select(this).text()]);
    dbOutput.push({"key":songPlaying.key,"answer":i})


    if(d3.select(".swiper-slide-active").classed("last-song")){

      if(sound){
        sound.stop();
      }

      d3.transition()
          .delay(0)
          .duration(1000)
          .tween("scroll", scrollTween(window.innerHeight));

      function scrollTween(offset) {
        return function() {
          var i = d3.interpolateNumber(window.pageYOffset || document.documentElement.scrollTop, offset);
          return function(t) { scrollTo(0, i(t)); };
        };
      }

      d3.select(".quiz-end").selectAll("p")
        .data(songOutput).enter().append("p")
        .text(function(d){
          return d[0] + ": "+d[1];
        })

      quizCompleted = true;
      db.update({"year":yearSelected,"answers":dbOutput});
      // db.update({ key: term, min, max, order });
    }
    else {
      let colorToAdd = window.getComputedStyle(d3.select(this).node(), null).getPropertyValue("background-color");
      let textToAdd = d3.select(this).select("span").text();

      songBubbles.each(function(d,i){
        if(i == (mySwiper.activeIndex - slideOffSet )){
          d3.select(this).style("background-color",colorToAdd);
          d3.select(this).append("p").attr("class","post-answer").text(textToAdd);
        }
      })
      mySwiper.slideNext(slideChangeSpeed, true);
    }








  });

}

function init() {

  setupDB();

  songBubbles = d3.select(".song").selectAll("div").data(d3.range(d3.selectAll(".song-quiz").size())).enter().append("div").attr("class","song-bubble");

  mySwiper = new Swiper ('.swiper-container', {
      slidesPerView:1,
      simulateTouch:false,
      touchStartPreventDefault:false,
      allowTouchMove:false,
    })

  mySwiper.on('slideChange', function () {
    if(mySwiper.activeIndex == slideOffSet){
      d3.select(".song").style("opacity",1);
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

  mySwiper.on('slideNextTransitionEnd', function () {
    if(d3.select(".swiper-slide-active").classed("loading-slide")){
      window.setTimeout(function(d){
        mySwiper.slideNext(slideChangeSpeed, true);
      },2000)
    }

    else if(d3.select(".swiper-slide-active").classed("song-quiz")){

      changeSong();

      function transition(path) {
        console.log("transitioning");
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
          d3.select(this).append("div").attr("class","year-text").text(songMap.get(songPlaying.key).chart_date.slice(0,4))

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

  });

  slideController();

  loadData(['unique_rows.csv','all_data.csv']).then(result => {
    songMap = d3.map(result[1].filter(function(d){
      return d.chart_date.slice(0,4).slice(2,3) == 1 && +d.rank < 5;
    }),function(d){return d.track_id});

    songs = result[0].filter(function(d){
      var id = d.key;
      if(songMap.has(id)){
        return d.song_url.length > 5;
      }
    });

	}).catch(console.error);

}

function setupDB() {
  db.setup();
  const answers = db.getAnswers();
  if(answers){
    d3.select(".decade-slide").remove();
    d3.select(".year-slide").remove();
    slideOffSet = slideOffSet - 2;
    yearSelected = answers["year"]
    answers["answers"].forEach(function(d){
      dbOutput.push(d);
    })
  }


}


export default { init, resize };
