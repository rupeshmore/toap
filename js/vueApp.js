let vue = new Vue({
    el: '#app',
    data: {
      title: 'Toap',
      urlToRecord: null,
      proxyURL: [],
      recordThinkTime: true,
      recordHeaders: false,
      newWindow: false,
      fileName: null,
      downloadFlowFile: [],
      comments: '',
      topeProxyStatus: [],
    },
    computed: {
      // a computed getter
      startTopeButton: function () {
        if (this.urlToRecord && this.fileName) {
          return 'enabled';
        } else {
          return 'disabled';
        }
      }
    },
    watch: {
    topeProxyStatus: function () {
      if (this.topeProxyStatus.length > 0 && !this.proxyURL.length) {
        $('#topeRunning').openModal();
      }
    }
  },
  created: function() {
    let topeProxyStatus = this.topeProxyStatus;
    let removeFromLocalStorage = this.removeFromLocalStorage;
    $.get(window.location.origin+'/getTopeProxyStatus', function(data){
      if (data.error) {
          topeProxyStatus.pop();
          removeFromLocalStorage();
      } else {
          topeProxyStatus.push(1);
      }
    }).error(function() {
      console.error('Failed');
    });

    let gettope = JSON.parse(localStorage.getItem('toap'));
    if (gettope) {
      if(gettope.proxyURL) {
          this.proxyURL = gettope.proxyURL;
      } else {
          //this.proxyURL = [];
          this.proxyURL.length = 0;
      }
      this.recordThinkTime = gettope.recordThinkTime;
      this.recordHeaders = gettope.recordHeaders;
      if (gettope.fileName) this.fileName = gettope.fileName;
      if (gettope.urlToRecord) this.urlToRecord = gettope.urlToRecord;
      if (gettope.downloadFlowFile) this.downloadFlowFile = gettope.downloadFlowFile;
      if (gettope.newWindow) this.newWindow = gettope.newWindow;
    }
  },
  methods: {
    saveToLocalStorage: function () {
      localStorage.setItem('toap', JSON.stringify({
        urlToRecord: this.urlToRecord,
        recordThinkTime: this.recordThinkTime,
        recordHeaders: this.recordHeaders,
        fileName: this.fileName,
        newWindow: this.newWindow,
        downloadFlowFile: this.downloadFlowFile,
        proxyURL: [this.proxyURL]
      }));
    },
    removeFromLocalStorage: function () {
      localStorage.removeItem('toap');
      this.proxyURL.length = 0;
    },
    startPorxyServer: function() {
      let postData = {
        urlToRecord: this.urlToRecord,
        recordThinkTime: this.recordThinkTime,
        recordHeaders: this.recordHeaders,
        fileName: this.fileName,
      };
      let topeProxyStatus = this.topeProxyStatus;
      let proxyURL = this.proxyURL;
      let localStorageSet = this.saveToLocalStorage;
      let downloadFlowFile = this.downloadFlowFile;
      let openNewWindow = this.newWindow;
      let fileName = this.fileName;
      let title = this.title;
      $.post(window.location.origin+'/start'+this.title, postData, function(response) {
        topeProxyStatus.push(1);
        Materialize.toast(title+' recorder started', 2000) // 4000 is the duration of the toast
        if(response.url) {
            proxyURL.push(response.url)
        };
        if (downloadFlowFile.length > 0) downloadFlowFile.pop();
        downloadFlowFile.push(fileName);
        //downloadFlowButton = 'enabled';
        localStorageSet();
        if (openNewWindow) window.open(response.url);
        return true;
      }).error(function() {
        console.log('Post Start'+this.title+' Failed');
        return false;
      });
    },
    stopProxyServer: function(index) {
      let topeProxyStatus = this.topeProxyStatus;
      let proxyURL = this.proxyURL;
      let localStorageRemove = this.removeFromLocalStorage;
      let urlToRecord = this.urlToRecord;
      let title = this.title;
      let clearLocalStorage = window.localStorage;
      $.post(window.location.origin+'/stop'+this.title, null,function(response) {
        topeProxyStatus.pop();
        Materialize.toast(title+' recorder stopped', 2000) // 3000 is the duration of the toast
        proxyURL.pop();
        localStorageRemove();
        urlToRecord = null;
        clearLocalStorage.clear();
        return true;
      }).error(function() {
        console.log('Stop '+this.title+' Failed');
      });
    },
    addComments: function() {
      let postData = {
        comments: this.comments
      };
      Materialize.toast('Comment: ' + this.comments, 2000) // 4000 is the duration of the toast
      this.comments = '';
      $.post(window.location.origin+'/addComments', postData, function(response) {
        return true;
    }).error(function() {
          console.error('Add Comments Failed');
      });
    },
    downloadFlow: function () {
        if (this.topeProxyStatus.length < 1 || this.proxyURL < 1) this.downloadFlowFile.pop();
    },
    delete: function(fn, index) {
      this[fn].splice(index, 1);
      localStorage.setItem('topeDownloadFlowFile', JSON.stringify(this.downloadFlowFile));
    },
  }
});
