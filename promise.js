import {default as Promise} from 'bluebird'
import {default as BluebirdCo} from 'bluebird-co/manual'

Promise.coroutine.addYieldHandler(BluebirdCo.toPromise)

export default Promise

