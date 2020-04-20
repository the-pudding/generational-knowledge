/* global d3 */
import Swiper from 'swiper';
import loadData from './load-data'
import {Howl, Howler} from 'howler';


let songs;
var sound = null;
let mySwiper = null;
let songOutput = [];
let songPlaying = null;
let songBubbles = null;
let slideOffSet = 4;
let songMap = null;

function resize() {}

function changeSong(){

  if(sound){
    sound.stop();
  }
  var song = songs[Math.round(songs.length*Math.random())];
  var url = song.song_url;
  songPlaying = song;

  sound = new Howl({
    src: ['https://p.scdn.co/mp3-preview/'+url+'.mp3']
  });
  sound.play();
}

function slideController(){
  d3.select(".start-slide").select(".red-button").on("click",function(d){
    mySwiper.slideNext(500, true);
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
    mySwiper.slideNext(500, true);
  });

  d3.select(".year-slide").selectAll(".grey-button").on("click",function(d){
    mySwiper.slideNext(500, true);
  });

  d3.selectAll(".options").selectAll("div").on("click",function(d){
    songOutput.push([songPlaying.artist+", "+songPlaying.title,d3.select(this).text()]);
    mySwiper.slideNext(500, true);
    console.log(songOutput);
  });

}

function init() {

  songBubbles = d3.select(".song").selectAll("div").data(d3.range(d3.selectAll(".song-quiz").size())).enter().append("div").attr("class","song-bubble");

  mySwiper = new Swiper ('.swiper-container', {
      slidesPerView:1,
      simulateTouch:false,
    })

  mySwiper.on('slideNextTransitionEnd', function () {
    if(d3.select(".swiper-slide-active").classed("loading-slide")){
      window.setTimeout(function(d){
        mySwiper.slideNext(500, true);
      },1000)
    }

    if(d3.select(".swiper-slide-active").classed("song-quiz")){

      changeSong();

      console.log(mySwiper.activeIndex - slideOffSet);

      d3.select(".song").style("transform","translate("+(-45-(35*(mySwiper.activeIndex - slideOffSet)))+"px,0px)")

      songBubbles.each(function(d,i){
        if(i == (mySwiper.activeIndex - slideOffSet)){
          d3.select(this).classed("song-bubble-active",true);
          d3.select(this).append("p").text(songMap.get(songPlaying.key).chart_date.slice(0,4))
        }
        else{
          d3.select(this).selectAll("p").remove();
          d3.select(this).classed("song-bubble-active",false);
        }
      })
    }

    if(d3.select(".swiper-slide-active").classed("song-output")){
      d3.select(".song-output").select("div").selectAll("p")
      .data(songOutput).enter().append("p")
      .text(function(d){
        return d[0] + ": "+d[1];
      })
    }



  });

  slideController();

  loadData(['unique_rows.csv','all_data.csv']).then(result => {
    songMap = d3.map(result[1].filter(function(d){
      return d.chart_date.slice(0,4).slice(2,3) == 9 && +d.rank < 2;
    }),function(d){return d.track_id});

    songs = result[0].filter(function(d){
      var id = d.key;
      if(songMap.has(id)){
        return d.song_url.length > 5;
      }
    });

	}).catch(console.error);

}

export default { init, resize };
