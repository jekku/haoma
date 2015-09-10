import {default as Promise, Promisify} from './promise.js'
import { default as mongo } from 'anytv-node-mongo'
import { default as cudl } from 'cuddle'
import { default as config } from './config'
import { default as _ } from 'lodash'

let run = Promise.coroutine(function*() {
    let games_id = yield promisify(get_games_id)()
    let partitioned_ids = partition(games_id, 20)
    let count = yield * get_by_batch(partitioned_ids)

    Promise.coroutine(update_by_batch)(count)
})

run()

function* update_by_batch (partitioned_data) {
    var err = yield * update_games_video_count(partitioned_data.shift())

    return partitioned_data.length
        ? yield * update_by_batch(partitioned_data)
        : !err
}

function* update_games_video_count (game_ids) {
    let results = yield _.reduce(game_ids, (result, count, game_id) => {
            result[count] = update_game_video_count.bind(null, game_id, count)

            return result
        }, {})

    return results
}

function update_game_video_count (game_id, count, callback) {
    let criteria = {game_id:game_id},
        mods = { $set : {video_count:count} }

    console.log(`Updating ${game_id} with ${count} videos.`)

    mongo.open(config.db_creds)
        .collection('games')
        .update(criteria, mods, callback)
}

function get_games_id (callback) {
    cudl.get.to(config.URL.games_url)
        .then(function (err, result) {
            let games_id = _.map(result, (item) => {
                return {game_id: item.game_id}
            });

            callback(null, games_id)
        })
}

function* get_by_batch (partitioned_ids, results = []) {
    var games_video_count = yield * get_games_video_count(partitioned_ids.shift())

    results.push(games_video_count)

    return partitioned_ids.length
        ? yield * get_by_batch(partitioned_ids, results)
        : results
}

function* get_games_video_count (game_ids) {
    let results = yield _.reduce(game_ids, (result, game) => {
            result[game.game_id] = get_game_video_count.bind(null, game.game_id)

            return result
        }, {})

    return results
}

function get_game_video_count (game_id, callback) {
    console.log(`Getting video count for ${game_id}`)

    mongo.open(config.db_creds)
        .collection('videos')
        .count({'snippet.meta.tags' : {'$in': ['anytv_'+game_id]}}, callback)
}

function partition (items, n) {
    let result = _.groupBy(items, function(item, i) {
        return Math.floor(i % n)
    });

    return _.values(result);
}

function promisify (func) {
    return Promise.promisify(func)
}

