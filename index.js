'use strict';

import { default as mongo } from 'anytv-node-mongo';
import { default as cudl } from 'cuddle';
import { default as config } from './config';
import { default as _ } from 'lodash';

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

    },

    get_videos = (game_id) => {
        mongo.open(config.db_creds)
            .collection('videos')
            .find({})
            .toArray();
    };

start();
