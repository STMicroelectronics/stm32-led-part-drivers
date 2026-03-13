/**
  ******************************************************************************
  * @file    mapping_hook.js
  * @author  GPAM Application Team
  * @brief   This file implements functions providing the mapping logic to generate code.
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2026 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
  ******************************************************************************
  */

/**
 * Nominal hook as per embedded software architecture
 *
 * We expect the codegen service to call this hook per component.
 *
 * @param {string}   component_id         identifier of the component being processed by the codegen service
 * @param {array}    component_templates  array of templates for component_id
 * @param {function} _get_hw_instances     function returning the hardware instances (from the configuration data model) associated to the component id
 * @param {function} get_global_getters_registry     function returning the get_global_getters_registry
 * @param {object}   _cfg_data             configuration data for the current software project
 * @param {string}   _secure_ctxt          indicates if the context is 'None' (no security), 'Secure' (secure context), 'Non-secure' (non-secure context)
 * @param {string}   _genfileslist_folder  where to write the list of files to be generated
 * @param {function} debug_print           function to evacuate logs
 * @return object describing the mapping rules to be applied, empty object if nothing to process
 */
module.exports.main_grouping_hook = function (
  component_id,
  component_templates,
  _get_hw_instances,
  get_global_getters_registry,
  _cfg_data,
  _secure_ctxt,
  _genfileslist_folder,
  debug_print,
  _strategy
) {
  /**
   * This function finds out which files must be generated based on the field info.interface (as implemented in .config/mx_led_parameters.json).
   * LED instances can use either the GPIO interface, or the PWM interface.
   * Templates for the GPIO codegen are located in .config/template/gpio; templates for the PWM codegen are located in .config/template/pwm;
   * When some LED instances use the [GPIO/PWM] interface, then [GPIO/PWM] templates are used. The two sets of templates can be used together in the same project.
   */

  let led_instances_configs = [];
  try {
    const globalGetters = get_global_getters_registry();
    const swConfigGettersAPI = globalGetters.swConfigGettersAPI.SWConfigurationAPI;
    const led_instancesIds = swConfigGettersAPI.getInstances(component_id);
    led_instances_configs = led_instancesIds.map(id => swConfigGettersAPI.getSwInstanceConfiguration(id));
  } catch (error) {
    debug_print(`Error in mapping hook for component ${component_id} : ${error.message}`);
  }

  const gpio_templates = component_templates.filter(elt => elt.includes('mx_led_template'));
  const pwm_templates = component_templates.filter(elt => elt.includes('mx_led_pwm_template'));

  const license_templates = component_templates.filter(elt => elt.includes('mx_led_part_drivers_license_template'));

  let Is_Gpio_Used = false;
  let Is_Pwm_Used = false;

  for (const instance of led_instances_configs) {
    switch (instance.info.interface) {
      case 'GPIO':
        Is_Gpio_Used = true;
        break;
      case 'PWM':
        Is_Pwm_Used = true;
        break;
      default:
        break;
    }
  }

  let hook_result = [];
  if (Is_Gpio_Used) {
    for (const template of gpio_templates) {
      hook_result.push(getHookResult(component_id, template, getTemplateName(template)));
    }
  }
  if (Is_Pwm_Used) {
    for (const template of pwm_templates) {
      hook_result.push(getHookResult(component_id, template, getTemplateName(template)));
    }
  }
  // if (always)
  for (const template of license_templates) {
      hook_result.push(getHookResult(component_id, template, getTemplateName(template)));
  }

  debug_print("################ LED HOOK ################");
  debug_print("component_templates", component_templates);
  debug_print("gpio_templates", gpio_templates);
  debug_print("pwm_templates", pwm_templates);
  debug_print("led_instances_configs", led_instances_configs);
  debug_print("Is_Gpio_Used", Is_Gpio_Used);
  debug_print("Is_Pwm_Used", Is_Pwm_Used);
  debug_print("hook_result", hook_result);
  return hook_result;
}


function getTemplateName(templateFileName) {
  return templateFileName.replace('_template', '').replace('.hbs', '');
}
function getHookResult(component_id, templateName, outputFileName) {
  return {
    component: component_id,
    resource_type: 'COMPONENT_ENTRY',
    resource: 'no hardware resource',
    template: templateName,
    output: outputFileName,
  };
}
