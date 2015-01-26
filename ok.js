var config = require('config').config;
var casper = require('casper').create({
    verbose:      false,
    logLevel:     "info",
    waitTimeout:  20000,
    viewportSize: {width: 480, height: 800},
    pageSettings: {
        userAgent:   config.user_agent,
        loadImages:  false,        // The WebPage instance used by Casper will
        loadPlugins: false         // use these settings
    }
});
var photos_cnt = 3;
var photos = [];

casper.on('remote.message', function (message) {
    this.echo('Page Debug Data:       ' + message);
});

casper.on('remote.alert', function (message) {
    this.echo('alert message: ' + message);
    // or if you want to test it

    this.captureSelector('alert_' + (Math.random()) + '.jpg', '#schedule', {
        format:  'jpg',
        quality: 75
    });
});

// Авторизация
casper.start(config.url, function () {
    this.fillSelectors(
        '#content form',
        {
            '#field_login':    config.user,
            '#field_password': config.pass
        }, true);
});

casper.thenOpen('http://instagram.com/old_vl', function () {
    var js = this.evaluate(function () {
        return document;
    });
    photos = js.all[0].outerHTML.match(/instagram.com\/p\/([\-\._\w\d]+)/igm);
});

casper.then(function () {
    photos = photos.slice(0, photos_cnt);

    casper.each(photos, function (self, url) {
        casper.echo("Ссылка на обработку: " + url, 'PARAMETER');

        casper.thenOpen('http://' + url, function () {
            debugger;
            var js = this.evaluate(function () {
                return document;
            });
            photos = js.all[0].outerHTML;

            function fff(cssSelector) {
                return document.querySelectorAll(cssSelector);
            }

            var data = this.evaluate(fff, '.photo.Frame.Image');
            var src = '';
            for (var i = 0; i < data[0].attributes.length; i++) {
                if (data[0].attributes[i].name === 'src') {
                    src = data[0].attributes[i].value;
                    break;
                }
            }
            var text = this.evaluate(fff, '.caption-text');
            this.echo(src, 'COMMENT');
            try {
                text = text[0].innerHTML;
            }
            catch (e) {
                text = 'From http://instagram.com/old_vl';
            }

            if (text.length > 0 && src.length > 0) {
                var filename = src.match(/([\-\._\w\d]+)$/gi);
                casper.then(function () {
                    this.download(src, 'downloads/' + filename[0]);
                });

                casper.thenOpen(config.albom_url, function () {
                    this.echo(this.getTitle(), 'COMMENT');
                    this.captureSelector('yoursitelist2.png', 'body');
                });

                casper.then(function () {
                    this.click('#group-album a.add-pho-plch');
                });

                casper.then(function () {
                    this.fillSelectors(
                        'form.js-sm-upload-form',
                        {
                            '#field_file': 'downloads/' + filename[0]
                        }, true);

                    this.captureSelector('yoursitelist3.png', 'body');
                });

                casper.then(function () {
                    this.waitForSelector('#content form', function () {
                        var msg = text.replace(/\s@([-_\.\w\d]+)/gi, ' http://instagram.com/$1').substr(0, 255)
                        casper.echo(msg, 'INFO');

                        this.fillSelectors(
                            '#content form',
                            {
                                '#field_msg': msg
                            }, true
                        );
                        this.captureSelector('yoursitelist4.png', 'body');
                    });
                });

                casper.then(function () {
                    this.click('[name=button_save]');

                    this.captureSelector('yoursitelist5.png', 'body');
                });
            }
        });
    })
});


casper.run(function () {
    // echo results in some pretty fashion
    this.echo('Done', 'GREEN_BAR').exit();
});
