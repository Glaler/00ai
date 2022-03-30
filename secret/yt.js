/*************************************
    GLOBAL FILTERS
 *************************************/

// Convert timestamp into a human date
Vue.filter('convertDate', function (value) {
    let date = new Date(value), 
        day = date.getDate(),
        month = date.getMonth() + 1,
        year = date.getFullYear();
    
    day = (day < 10) ? '0' + day : day;
    month = (month < 10) ? '0' + month : month;
  
    let res = day + '.' + 
              month + '.' + year;
    return res;
});

// Convert a numberin a string  with decimal points
Vue.filter("formatNumber", function (value) {
  var formatNumber = value.toString(),
      arr = formatNumber.split("").reverse(),
      count = 0;
  
  arr.forEach(function(item){
    if(count !== 0 && count % 3 === 0){
      arr[count] = item + '.';
    }
    count++;
  });

  arr = arr.reverse();
  formatNumber = arr.join("");
  
  return formatNumber;
});




/*************************************
    COMPONENTS
 *************************************/

// Root component
Vue.component('main-component', {
  props: ['title', 'search'],
  template: `
    <section class="main-wrapper"> 
      <header>
        <h1>
          <router-link :to="'/' + search" class="brand">
            {{ title }}
          </router-link>
        </h1>
      </header>

      <search-bar :search="search"></search-bar>

      <!-- route outlet -->
      <router-view :search="search" @update="upsearch"></router-view>
    </section>
  `,
  methods: {
    upsearch(src){
      this.$emit('upsearch', src)
    }
  }
});

// Search component
Vue.component('search-bar', {
  props: ['search'],
  template: ` 
  <div class="wrap-search">
    <p class="search">
      <input 
        v-model="search"
        @keyup="enterSearch"
        @focus="$event.target.select()"
      >
    </p>
    <p class="submit">
      <router-link :to="'/' + search" class="brand">
        <i class="material-icons">search</i>
      </router-link>
    </p>
  </div>
  `,
  methods: {
    enterSearch(ev){
      if(ev.code === 'Enter'){
        router.push('/' + this.search);
      }
    }
  }
});


/*** PAGE COMPONENTS FOR ROUTER ***/

const Archive = Vue.component('archive', {
  props: ['search'],
  template: `
    <section class="youtube-archive">
      <div class="video-results">
        <div v-for="video in videos" class="column">
          <router-link :to="'/video/' + video.id.videoId" class="video">
            <div class="wrap-thumb">
              <img :src="video.snippet.thumbnails.medium.url"
                   :height="video.snippet.thumbnails.medium.height"
                   :width="video.snippet.thumbnails.medium.width"
                   :alt="video.snippet.title">
            </div>
            <div class="content">
              <h3>{{ video.snippet.title }}</h3>
              <div class="channel">{{ video.snippet.channelTitle }}</div>
              <time>{{ video.snippet.publishedAt | convertDate }}</time>
            </div>
          </router-link>
        </div>
      </div>

      <div class="pagination">
        <a v-if="prevPage" class="prev" href="#" @click.prevent="getPage('prev')">Prev</a>
        <a v-if="nextPage" class="next" href="#" @click.prevent="getPage('next')">Next</a>
      </div>
    </section>
  `,
  data() { 
    return{
      pageCount: 48,
      direction: '',
      nextPage: null,
      prevPage: null,
      orderBy: 'viewCount', 
      videos: null,
    }
  },
  mounted(){
    this.getArchive(this.search);
  },
  watch: {
    '$route' (to, from) {
      this.getArchive(this.search);
    }
  },
  methods: {
    // Pagination
    getPage(dir){
      this.direction = dir;
      this.getArchive(this.search);
      window.scrollTo(0, 0);
    },
    // Get archive after a search and on init
    getArchive(arg){
      if(this.$route.params.search !== undefined){
        arg = this.$route.params.search;
      }
      
      this.$emit('update', arg); //update search text
      this.getVideos(arg);
    },
    getVideos(src){
      $ctx = this;
      // Settings
      const baseUrl = 'https://www.googleapis.com/youtube/v3/';
      let part = 'snippet',
          q    = src,
          type = 'video',
          order = this.orderBy,
          maxResults = this.pageCount,
          url  = baseUrl + 'search?part=' + part + '&q=' + q + '&type=' + type +
                '&order=' + order + '&maxResults=' + maxResults + '&key=AIzaSyAs_tSQYJXX9axDYXkYGe9RZmt1p-XRFWo';
      
      // Pagination
      if(this.direction === 'next'){
        url += '&pageToken=' + this.nextPage;
      }
      else if(this.direction === 'prev'){
        url += '&pageToken=' + this.prevPage;
      }
      
      axios.get(url)
      .then(function (response) {
        $ctx.nextPage = (response.data.nextPageToken) ? response.data.nextPageToken : null;
        $ctx.prevPage = (response.data.prevPageToken) ? response.data.prevPageToken : null;
        $ctx.videos =  response.data.items
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  }
});

const Detail = Vue.component('detail', {
  template: `
    <section class="video-detail">
      <div class="content">
        <div class="wrap-player">
          <iframe width="560" height="315" 
          :src="'https://loader.to/api/button/?url=' +  
          video.id + ''" 
          frameborder="0" allowfullscreen></iframe>
        </div>
                  
        <h2>{{ video.snippet.title }}</h2>
        <div class="stats">
          <span>
            <i class="material-icons">remove_red_eye</i>
            <span class="label">{{ video.statistics.viewCount | formatNumber }}</span>
          </span>
          <span>
            <i class="material-icons">date_range</i>
            <span class="label">{{ video.snippet.publishedAt | convertDate }}</span>
          </span>
          <span>
            <i class="material-icons">thumb_up</i>
            <span class="label">{{ video.statistics.likeCount | formatNumber }}</span>
          </span>
          <span>
            <i class="material-icons">thumb_down</i>
            <span class="label">{{ video.statistics.dislikeCount | formatNumber }}</span>
          </span>
        </div>
        <div class="channel">
          <i class="material-icons">videocam</i>
          {{ video.snippet.channelTitle }}
        </div>
        <div class="description">{{ video.snippet.description }}</div>
      </div>
      
      <div class="sidebar">
        <div class="related">
          <div v-for="video in related" class="wrap-rel-video">
            <router-link :to="'/video/' + video.id.videoId" class="video">
              <div class="wrap-thumb">
                <img :src="video.snippet.thumbnails.medium.url"
                     :height="video.snippet.thumbnails.medium.height"
                     :width="video.snippet.thumbnails.medium.width"
                     :alt="video.snippet.title">
              </div>
              <div class="content">
                <h3>{{ video.snippet.title }}</h3>
                <div class="channel">{{ video.snippet.channelTitle }}</div>
                <time>{{ video.snippet.publishedAt | convertDate }}</time>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>
  `,
  data(){
    return {
      videoId: this.$route.params.id,
      video: null,
      related: null
    }
  },
  watch: {
    '$route' (to, from) {
      this.getVideo(this.$route.params.id);
    }
  },
  mounted(){
    this.getVideo(this.videoId);
  },
  methods: {
    getVideo(vidId){
      $ctx = this;

    // Settings
    const baseUrl = 'https://www.googleapis.com/youtube/v3/';
    let part = 'snippet,contentDetails,statistics,player',
        id    = vidId,
        url  = baseUrl + 'videos?id=' + id + '&part=' + part + '&key=AIzaSyAs_tSQYJXX9axDYXkYGe9RZmt1p-XRFWo';

    axios.get(url)
    .then(function (response) {
      $ctx.video = response.data.items[0];
      
      // Related
      let urlRel = baseUrl + 'search?part=snippet&relatedToVideoId=' + 
                   vidId + 
                   '&type=video&key=AIzaSyAs_tSQYJXX9axDYXkYGe9RZmt1p-XRFWo';
      axios.get(urlRel)
      .then(function (response) {
        $ctx.related = response.data.items;
      });
      
    })
    .catch(function (error) {
      console.log(error);
    });
    }
  }
});




/***********************************
    VUE ROUTER
 ***********************************/

/*** ROUTER ***/
const routes = [
  { path: '/', component: Archive }, 
  { path: '/:search', component: Archive },
  { path: '/video/:id', component: Detail }
];

const router = new VueRouter({
  routes: routes
});

router.beforeEach(function (to, from, next) {
  window.scrollTo(0, 0);
  next();
});




/**************************************
    INIT APP
 **************************************/

var app = new Vue({
  el: '#app',
  router,
  data: {
    appTitle: 'pahilagana', 
    search: 'trending songs'
  },
  methods: {
    upSearch(src){
      this.search = src;
    }
  }
});
