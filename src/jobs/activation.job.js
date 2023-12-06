const _ = require("lodash")
const Promise = require("bluebird")
const APIGS = require("../services/api-gs.service")
const getStaticConfig = require("../configs/account.config")
const Mongo = require("../services/mongo.service")

const createShootingMethod = async (config, _shootingmethod) => {
    const api = new APIGS(config.token, config.account_id, config.api)

    const shootingmethods = await api.getShootingmethod()
    let shootingmethod = _.find(shootingmethods, sm => _.deburr(sm.shootingmethod).toUpperCase() === _.deburr(_shootingmethod).toUpperCase())
    if (!shootingmethod) {
        console.log(`create shooting method "${_shootingmethod}"`)
        shootingmethod = await api.setShootingmethod({ shootingmethod: _shootingmethod })
    } else {
        console.log(`Shooting method "${_shootingmethod}" already exist`)
    }

    return shootingmethod.shooting_method_id
}

const createFormats = async (config) => {
    const api = new APIGS(config.token, config.account_id, config.api)

    const formatsExist = await api.getFormats()

    return await Promise.mapSeries(_.toArray(config.formats), async format => {
        let formatExist = _.find(formatsExist, f => f.smalltext === format.smalltext)
        if (!formatExist) {
            console.log('create format', format.smalltext)
            try {
                const _format = {
                    border_strategy: {
                        top: {
                            size: 5,
                            unit: "%"
                        },
                        bottom: {
                            size: 5,
                            unit: "%"
                        },
                        left: {
                            size: 5,
                            unit: "%"
                        },
                        right: {
                            size: 5,
                            unit: "%"
                        },
                    },
                    ...format
                }
                delete _format.crop_recognizable
                delete _format.clipping
                delete _format.date_activation
                formatExist = await api.setFormat(_format)
            } catch (error) {
                console.error(error)
            }
        } else {
            console.log('Format', format.smalltext, 'already exist')
        }
        format.format_id = formatExist.format_id
        return format
    })
}

const createWebhooks = async (config, actualConfig) => {
    const api = {
        [config.account_id]: new APIGS(config.token, config.account_id, config.api),
    }
    const actualWebhooks = {
        [config.account_id]: actualConfig && actualConfig.webhooks[config.account_id] || [],
    }
    console.log('actualWebhooks', actualWebhooks)

    const res = {}

    await Promise.mapSeries(_.uniq([config.account_id]), async account_id => {
        const webhooksExist = await api[account_id].getWebhook()
        console.log('webhooksExist', webhooksExist)
        await Promise.mapSeries(['pictures/create', 'pictures/update'], async topic => {
            let exist = _.find(webhooksExist, webhook => webhook.topic === topic && webhook.address === process.env.WEBHOOK_HOST)
            if (!exist) {
                exist = await api[account_id].setWebhook({
                    address: process.env.WEBHOOK_HOST,
                    topic: topic
                })

            } else {
                actualWebhooks[account_id] = _.filter(actualWebhooks[account_id], actualWebhook_id => actualWebhook_id != exist.webhook_id)
            }
            res[account_id] = res[account_id] || []
            res[account_id].push(exist.webhook_id)
        })
        if (_.size(actualWebhooks[account_id]) > 0) {
            await Promise.mapSeries(actualWebhooks[account_id], async webhook_id => {
                try {
                    await api[account_id].deleteWebhook(webhook_id)
                } catch (err) {
                    console.error(err)
                }
            })
        }
    })

    console.log('res', res)

    return res
}

const cleanWebhooks = async (config) => {
    const api = new APIGS(config.token, config.account_id, config.api)

    const webhooksExist = await api.getWebhook()
    await Promise.mapSeries(['pictures/create', 'pictures/update'], async topic => {
        // const exist = _.find(webhooksExist, webhook => webhook.topic === topic && webhook.address === process.env.WEBHOOK_HOST)
        const exist = _.find(webhooksExist, webhook => webhook.topic === topic)
        if (exist) {
            await api.deleteWebhook(exist.webhook_id)
        }
    })
}

const createExportsFormats = async (config, formats) => {
    const api = new APIGS(config.token, config.account_id, config.api)

    const exportsExist = await api.getExports()

    return await Promise.mapSeries(formats, async format => {
        let exportExist = _.find(exportsExist, e => e.smalltext === (format.export_name || format.smalltext) && !e.archived)

        if (!exportExist) {
            console.log('create export', format.export_name, format.smalltext)
            try {
                const _export = {
                    smalltext: format.export_name || format.smalltext,
                    format_ids: [format.format_id],
                    config: {
                        resize: {
                            active: true,
                            width: format.width,
                            height: format.height
                        },
                        filter: {
                            match: `/${format.smalltext.toLowerCase()}/`
                        },
                        target: {
                            "name": `/${format.smalltext}/{PICTURE_REF}_{$INC_VIEW}.${(format.file_format || "jpg").toLowerCase()}`,
                        },
                        background_color: format.file_format.toLowerCase() === "jpg" || format.file_format.toLowerCase() === "jpeg" ? format.background_color || "#FFFFFF" : undefined,
                        apply_frame: true,
                        extend_background: true,
                    }
                }
                exportExist = await api.setExport(_export)
            } catch (error) {
                console.error(error)
            }
        } else {
            console.log('Export', exportExist.smalltext, 'already exist')
        }

        return exportExist
    })
}

const createTemplate = async (config, exports, templateConfig) => {
    const api = new APIGS(config.token, config.account_id, config.api)
    const templates = await api.getTemplates()

    let exist = _.find(templates, template => _.deburr(template.smalltext).toUpperCase() === _.deburr(templateConfig.smalltext).toUpperCase())
    if (!exist) {
        console.log('create Template', templateConfig.smalltext)
        try {
            templateConfig.production.delegation_account_id = config.account_id
            templateConfig.production.exports[config.account_id] = _.map(exports, _export => ({ export_id: _export.export_id}))

            exist = await api.setTemplate(templateConfig)
        } catch (error) {
            console.error(error)
        }
    } else {
        console.log('Template', exist.smalltext, 'already exist')
    }

    return exist.template_id
}

const activePlugin = async (config, _plugin) => {
    const api = new APIGS(config.token, config.account_id, config.api)
    const plugins = await api.getPlugins()
    console.log('plugins', plugins)

    let plugin = _.find(plugins, plugin => _.deburr(plugin.smalltext).toUpperCase() === _.deburr(_plugin).toUpperCase())
    if(!plugin) {
        throw "Le plugin dspp n'existe pas"
    }
    if (!plugin.active) {
        console.log("On active le plugin", _plugin)
        await api.activePlugin(plugin.plugin_id)
    } else {
        console.log("Le plugin " + _plugin + " est déjà activé")
    }

    return plugin.plugin_id
}

const activation = async (account_id) => {
    const mongo = new Mongo()
    let actualConfig
    try {
        actualConfig = await mongo.getConfigurationForAccount(account_id)
    } catch (err) {
    }
    const staticConfig = getStaticConfig(account_id)
    if (!staticConfig) {
        throw "Config not found"
    }

    const config = await mongo.saveConfiguration(staticConfig)
    console.log(config)
}

module.exports = {
    createShootingMethod,
    createFormats,
    createWebhooks,
    cleanWebhooks,
    createExportsFormats,
    createTemplate,
    activePlugin,
    activation
}

