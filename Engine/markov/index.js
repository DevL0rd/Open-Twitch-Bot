var EventEmitter = require('events').EventEmitter;
var deck = require('deck');
var Lazy = require('lazy');
var Hash = require('hashish');
var fs = require('fs');
module.exports = function(order) {
    if (!order) order = 2;
    var db = {};
    var self = {};

    self.seed = function(seed, cb) {
        if (seed instanceof EventEmitter) {
            Lazy(seed).lines.forEach(self.seed);

            if (cb) {
                seed.on('error', cb);
                seed.on('end', cb);
            }
        } else {

            var text = (Buffer.isBuffer(seed) ? seed.toString() : seed)
            if (text != undefined) {
                var words = text.split(/\s+/);
                var links = [];

                for (var i = 0; i < words.length; i += order) {
                    var link = words.slice(i, i + order).join(' ');
                    links.push(link);
                }

                if (links.length <= 1) {
                    if (cb) cb(null);
                    return;
                }

                for (var i = 1; i < links.length; i++) {
                    var word = links[i - 1];
                    var cword = clean(word);
                    var next = links[i];
                    var cnext = clean(next);

                    var node = db[cword] !== undefined ?
                        db[cword] :
                        {
                            count: 0,
                            words: {},
                            next: {},
                            prev: {},
                        };
                    db[cword] = node;

                    node.count++;
                    node.words[word] = node.words[word] === undefined ? 1 : node.words[word] + 1;
                    node.next[cnext] = node.next[cnext] === undefined ? 1 : node.next[cnext] + 1;
                    if (i > 1) {
                        var prev = clean(links[i - 2]);
                        node.prev[prev] = node.prev[prev] === undefined ? 1 : node.prev[prev] + 1;
                    } else {
                        node.prev[''] = (node.prev[''] || 0) + 1;
                    }
                }

                if (db[cnext] === undefined) db[cnext] = {
                    count: 1,
                    words: {},
                    next: {
                        '': 0
                    },
                    prev: {},
                };
                var n = db[cnext];
                n.words[next] = n.words[next] === undefined ? 1 : n.words[next] + 1;
                n.prev[cword] = n.prev[cword] === undefined ? 1 : n.prev[cword] + 1;
                n.next[''] = (n.next[''] || 0) + 1;

                if (cb) cb(null);
            }


        }
    };

    self.search = function(text) {
        var words = text.split(/\s+/);

        // find a starting point...
        var start = null;
        var groups = {};
        for (var i = 0; i < words.length; i += order) {
            var word = clean(words.slice(i, i + order).join(' '));
            if (Hash.has(db, word)) groups[word] = db[word].count;
        }

        return deck.pick(groups);
    };

    self.pick = function() {
        return deck.pick(Object.keys(db))
    };

    self.next = function(cur) {
        if (!cur || !db[cur]) return undefined;

        var next = deck.pick(db[cur].next);
        return next && {
            key: next,
            word: deck.pick(db[next].words),
        } || undefined;
    };

    self.prev = function(cur) {
        if (!cur || !db[cur]) return undefined;

        var prev = deck.pick(db[cur].prev);
        return prev && {
            key: prev,
            word: deck.pick(db[prev].words),
        } || undefined;
    };

    self.forward = function(cur, limit) {
        var res = [];
        while (cur && !limit || res.length < limit) {
            var next = self.next(cur);
            if (!next) break;
            cur = next.key;
            res.push(next.word);
        }

        return res;
    };

    self.backward = function(cur, limit) {
        var res = [];
        while (cur && !limit || res.length < limit) {
            var prev = self.prev(cur);
            if (!prev) break;
            cur = prev.key;
            res.unshift(prev.word);
        }

        return res;
    };

    self.fill = function(cur, limit) {
        var res = [deck.pick(db[cur].words)];
        if (!res[0]) return [];
        if (limit && res.length >= limit) return res;;

        var pcur = cur;
        var ncur = cur;

        while (pcur || ncur) {
            if (pcur) {
                var prev = self.prev(pcur);
                pcur = null;
                if (prev) {
                    pcur = prev.key;
                    res.unshift(prev.word);
                    if (limit && res.length >= limit) break;
                }
            }

            if (ncur) {
                var next = self.next(ncur);
                ncur = null;
                if (next) {
                    ncur = next.key;
                    res.push(next.word);
                    if (limit && res.length >= limit) break;
                }
            }
        }

        return res;
    };

    self.respond = function(text, limit) {
        var cur = self.search(text) || self.pick();
        return self.fill(cur, limit);
    };

    self.word = function(cur) {
        return db[cur] && deck.pick(db[cur].words);
    };
    self.readExternal = function(path) {
        if (fs.existsSync(path)) {
            fs.readFile(path, 'utf8', function(err, data) {
                if (err) {
                    return console.log(err);
                }
                db = JSON.parse(data);
            });
        }
    };

    self.writeExternal = function(path) {
        fs.writeFile(path, JSON.stringify(db), function(err) {
            if (err) {
                return console.log(err);
            }
        });
    };

    return self;
};

function clean(s) {
    return s
        .toLowerCase()
        .replace(/[^a-z\d]+/g, '_')
        .replace(/^_/, '')
        .replace(/_$/, '');
}