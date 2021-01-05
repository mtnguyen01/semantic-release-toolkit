import { castArray } from 'lodash'
import { sync as readPkgUp } from 'read-pkg-up'

import {
  TPlugin,
  TPluginConfig,
  TPluginFactory,
  TPluginFactoryOptions,
  TPluginFactoryOptionsNormalized,
  TPluginMetaContext,
  TReleaseHandler,
  TReleaseStep,
  TSemrelContext,
} from './interface'

export * from './interface'

export const releaseSteps: Array<TReleaseStep> = [
  'verifyConditions',
  'analyzeCommits',
  'verifyRelease',
  'generateNotes',
  'prepare',
  'publish',
  'addChannel',
  'success',
  'fail',
]

export const defaultOptions = {
  include: releaseSteps,
  exclude: [],
  require: [],
  handler: async (): Promise<void> => {
    /* async noop */
  },
  name: String(readPkgUp({ cwd: module?.parent?.filename })?.packageJson?.name),
}

export const normalizeOptions = (
  options: TReleaseHandler | TPluginFactoryOptions,
): TPluginFactoryOptionsNormalized => {
  const preOptions =
    typeof options === 'function' ? { handler: options } : options

  return { ...defaultOptions, ...preOptions }
}

const checkPrevSteps = (
  { invoked }: TPluginMetaContext,
  { name, require }: TPluginFactoryOptionsNormalized,
  step: TReleaseStep,
): void => {
  if (require.length === 0) {
    return
  }

  const prevSteps = releaseSteps.slice(0, releaseSteps.indexOf(step))
  const missedStep = prevSteps.find(
    (step) => require.includes(step) && !invoked.includes(step),
  )

  if (missedStep) {
    throw new Error(
      `plugin '${name}' requires ${missedStep} to be invoked before ${step}`,
    )
  }
}

export const getStepConfig = (
  context: TSemrelContext,
  step: TReleaseStep,
  name = '',
): TPluginConfig =>
  castArray(context.options?.[step])
    .map((config) => {
      if (Array.isArray(config)) {
        const [path, opts] = config

        return { ...opts, path }
      }

      return config
    })
    .find((config) => config?.path === name) || {}

export const getStepConfigs = (
  context: TSemrelContext,
  name = '',
): Record<TReleaseStep, TPluginConfig> =>
  releaseSteps.reduce<Record<TReleaseStep, TPluginConfig>>((configs, step) => {
    configs[step] = getStepConfig(context, step, name)

    return configs
  }, {} as Record<TReleaseStep, TPluginConfig>)

export const createPlugin: TPluginFactory = (options) => {
  const normalizedOpions = normalizeOptions(options)
  const { handler, include, exclude, name } = normalizedOpions
  const metaContext: TPluginMetaContext = {
    invoked: [],
  }

  return releaseSteps
    .filter((step) => include.includes(step) && !exclude.includes(step))
    .reduce<TPlugin>((m, step) => {
      m[step] = (pluginConfig: TPluginConfig, context: TSemrelContext) => {
        checkPrevSteps(metaContext, normalizedOpions, step)

        metaContext.invoked.push(step)

        const stepConfigs = getStepConfigs(context, name)
        const stepConfig = stepConfigs[step]

        return handler({ pluginConfig, context, step, stepConfig, stepConfigs })
      }

      return m
    }, {})
}
