import Rete from 'rete'
import {
  Event,
  EngineContext,
  NodeData,
  MagickNode,
  MagickWorkerInputs,
  MagickWorkerOutputs,
  GetEventArgs,
} from '../../types'
import { InputControl } from '../../dataControls/InputControl'
import {
  triggerSocket,
  anySocket,
  eventSocket,
  stringSocket,
  arraySocket,
} from '../../sockets'
import { MagickComponent } from '../../magick-component'
import { API_ROOT_URL } from '../../config'
const info = 'Event Recall is used to get conversation for an agent and user'

//add option to get only events from max time difference (time diff, if set to 0 or -1, will get all events, otherwise will count in minutes)
type InputReturn = {
  events: any[]
}

export class EventRecall extends MagickComponent<Promise<InputReturn>> {
  constructor() {
    super('Event Recall')

    this.task = {
      outputs: {
        events: 'output',
        trigger: 'option',
      },
    }

    this.category = 'Events'
    this.display = true
    this.info = info
    this.runFromCache = true
  }

  builder(node: MagickNode) {
    const eventInput = new Rete.Input('event', 'Event', eventSocket)
    const embedding = new Rete.Input('embedding', 'Embedding', arraySocket)
    const out = new Rete.Output('events', 'Events', arraySocket)
    const dataInput = new Rete.Input('trigger', 'Trigger', triggerSocket, true)
    const dataOutput = new Rete.Output('trigger', 'Trigger', triggerSocket)

    const nameInput = new InputControl({
      dataKey: 'name',
      name: 'Input name',
      placeholder: 'Conversation'
    })

    const type = new InputControl({
      dataKey: 'type',
      name: 'Type',
      icon: 'moon',
      placeholder: 'conversation'
    })

    const max_count = new InputControl({
      dataKey: 'max_count',
      name: 'Max Count',
      icon: 'moon',
      defaultValue: '6',
    })

    node.inspector.add(nameInput).add(type).add(max_count)

    return node
      .addInput(dataInput)
      .addInput(eventInput)
      .addInput(embedding)
      .addOutput(dataOutput)
      .addOutput(out)
  }

  async worker(
    node: NodeData,
    inputs: MagickWorkerInputs,
    _outputs: MagickWorkerOutputs,
  ) {
    const getEventsbyEmbedding = async (params: any) => {
      
      const urlString = `${API_ROOT_URL}/events`
      const url = new URL(urlString)
      
      url.searchParams.append('embedding', params['embedding'])
      const response = await fetch(url.toString())
      if (response.status !== 200) return null
      const json = await response.json()
      return json
    }
    const getEvents = async (params: GetEventArgs) => {
      const urlString = `${API_ROOT_URL}/events`
      const url = new URL(urlString)
      for (const p in params) {
        // append params to url, make sure to preserve arrays
        if (Array.isArray(params[p])) {
          params[p].forEach(v => url.searchParams.append(p, v))
        } else {
          url.searchParams.append(p, params[p])
        }
      }
      const response = await fetch(url.toString())
      if (response.status !== 200) return null
      const json = await response.json()
      return json.data
    }
    const event = (inputs['event'] && (inputs['event'][0] ?? inputs['event'])) as Event
    let embedding = (inputs['embedding'] ? inputs['embedding'][0] : null) as number[]
    if (typeof(embedding) == 'string') embedding = (embedding as any).replace('[',"").replace(']',"");embedding = (embedding as any)?.split(',')
    const { observer, client, channel, channelType, projectId, entities } = event
    const typeData = node?.data?.type as string
    const type =
      typeData !== undefined && typeData.length > 0
        ? typeData.toLowerCase().trim()
        : 'none'

    const maxCountData = node.data?.max_count as string
    const maxCount = maxCountData ? parseInt(maxCountData) : 10

    const data = {
      type,
      observer,
      client,
      entities,
      channel,
      channelType,
      projectId,
      maxCount,
    }
    let events
    if (embedding) data['embedding'] = embedding
    if (embedding) {
      if (embedding.length == 1536) {
        const enc_embed = new Float32Array(embedding)
        const uint = new Uint8Array(enc_embed.buffer)
        const str = btoa(
          String.fromCharCode.apply(
            null,
            Array.from<number>(new Uint8Array(uint))
          )
        )
        events = await getEventsbyEmbedding({ embedding: str })
      }
    } else {
      events = await getEvents(data)
    }
    
    return {
      events,
    }
  }
}
