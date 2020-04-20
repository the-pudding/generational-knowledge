/* global d3 */
import Swiper from 'swiper';
import loadData from './load-data'
import {Howl, Howler} from 'howler';


let songs;
var sound = null;
let mySwiper = null;
let songOutput = [];
let songPlaying = null;

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
    var songMap = d3.map(result[1].filter(function(d){
      return d.chart_date.slice(0,4).slice(2,3) == 0 && +d.rank < 2;
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
