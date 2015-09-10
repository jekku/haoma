'use strict';

import { default as mongo } from 'anytv-node-mongo';
import { default as cudl } from 'cuddle';
import { default as config } from './config';
import { default as _ } from 'lodash';
import { default as async} from 'async';

let gathered_data = [],

    start = () => {
        cudl.get.to(config.URL.games_url).
            then(gather_ids);
    },

    gather_ids = (err, result) => {
        if (err) {
            return console.warn(err);
        }
        let partitioned_ids = [];

        gathered_data = _.map(result, (item) => {
            return {game_id: item.game_id}
        });

        partitioned_ids = partition(gathered_data, 20);

        exec(partitioned_ids);
    },

    exec = (partitioned_ids) => {
        let jobs = create_jobs(partitioned_ids);

        async.series(jobs, (err, result) => {
            console.log(_.merge.apply(null, result));
        });
    },

    create_jobs = (x) => {
        let jobs = _.map(x, (game_ids) => {
            let j = _.reduce(game_ids, (result, game) => {
                result[game.game_id] = get_videos.bind(null, game.game_id)

                return result;
            }, {});

            return function (cb) {
                async.parallel(j, (err, result) => {
                    cb(err, result);
                })
            }
        });

        return jobs;
    },

    partition = (items, n) => {
        var result = _.groupBy(items, function(item, i) {
            return Math.floor(i % n);
        });

        return _.values(result);
    },

    get_videos = (game_id, callback) => {
        mongo.open(config.db_creds)
            .collection('videos')
            .count({'snippet.meta.tags' : {'$in': ['anytv_'+game_id]}}, callback);
    };

start();
