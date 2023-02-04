
import {DiscordAgentWindow, MessageService} from '@magickml/plugin-discord'
import {EventStore, EventRecall, WeaviateService} from '@magickml/plugin-weaviate'
export class Plugin {
    name: string;
    nodes: any;
    services:any;
    windowComponents: []
    agentComponents: []
    setup: Function;
    teardown: Function;
    constructor({
        name,
        nodes,
        services,
        windowComponents,
        agentComponents,
        setup,
        teardown
    }) {
        this.name = name;
        this.nodes = nodes;
        this.services = services;
        this.windowComponents = windowComponents;
        this.agentComponents = agentComponents;
        this.setup = setup;
        this.teardown = teardown;
    }


}

class PluginManager {
    static pluginList: Array<Plugin>;
    static componentList: Object;
    constructor(){
        PluginManager.pluginList = new Array<Plugin>();
    }

    register(plugin: Plugin){
        PluginManager.pluginList.push(plugin)
        plugin.setup()
    }
    /*
    Gets All Agent Components from all the registered plugins 
    */
    getAgentComponents(){
        let agentComp = []
        PluginManager.pluginList.forEach((plugin) => {
            plugin.agentComponents.forEach((component) => {
                agentComp.push(component)
            })
        })
        return agentComp
    }
    /*
    Gets All Services from all the registered plugins 
    */
    getServices(){
        let services_list = []
        PluginManager.pluginList.forEach((plugin) => {
            plugin.services.forEach((service) => {
                services_list.push([plugin.name,service])
            })
        })
        return services_list
    }

    async teardown(plugin: Plugin){
        plugin.teardown()
        PluginManager.pluginList.pop()
    }
    /*
    Gets All Nodes from all the registered plugins 
    */
    getNodes(){
        let nodes = {}
        
        PluginManager.pluginList.forEach((plugin) => {
            
            let plug_nodes = {}
            plugin.nodes.forEach((node) => {
                let id = Math.random().toString(36).slice(2, 7);
                let obj = {}
                obj[id] = () => new node()
                plug_nodes = {...plug_nodes, ...obj}
            })
            nodes = {...nodes, ...plug_nodes}
        })

        return nodes;
    }
}

export const pluginManager = new PluginManager()

const DiscordPlugin = new Plugin({
    'name': 'DiscordPlugin', 
    'nodes': [], 
    'services': [MessageService], 
    'agentComponents' : [DiscordAgentWindow], 
    'windowComponents': [], 
    'setup': ()=>{console.log("DiscordPlugin")}, 
    'teardown': ()=>{console.log("DiscordPlugin")} })

const WeaviatePlugin = new Plugin({
    'name': 'WeaviatePlugin', 
    'nodes': [ EventStore, EventRecall], 
    'services': [WeaviateService], 
    'agentComponents' : [], 
    'windowComponents': [], 
    'setup': ()=>{console.log("HUII")}, 
    'teardown': ()=>{console.log("HUIII")} })

pluginManager.register(WeaviatePlugin)
pluginManager.register(DiscordPlugin)