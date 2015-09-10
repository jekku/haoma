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

        gathered_data = _.map(result, (item) => {
            return {
                game_id: item.game_id
            }
        });

        bind_video_counts();
    },

    bind_video_counts = () => {
        let jobs = _.reduce(gathered_data, (result, game) => {
            result[game.game_id] = get_videos.bind(null, game.game_id);
            return result
        }, {});

        async.parallel(jobs, (err, result) => {
            console.log(result);
        });
    },

    get_videos = (game_id, callback) => {
        mongo.open(config.db_creds)
            .collection('videos')
            .count({'snippet.meta.tags' : {'$in': ['anytv_'+game_id]}}, callback);
    };

start();
