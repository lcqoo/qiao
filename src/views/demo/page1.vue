<template>
  <div class="demo-page1 layout-global_nets">
    <div class="assign_model layout-global_nets">
      <div>
        <h4>sourceData</h4>
        <pre>{{ sourceData }}</pre>
      </div>
      <div>
        <h4>init-formModel</h4>
        <pre>{{ initFormModel }}</pre>
      </div>
      <div>
        <h4>setData-formModel</h4>
        <pre>{{ sourceData ? JSON.stringify(formModel, null, 2) : '' }}</pre>
      </div>
      <div>
        <h4>reverseData</h4>
        <pre>{{ reverseData }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { DataBackup } from '@/common/$classes';
import * as $utils from '@/common/$utils';

import { ref, reactive } from 'vue';

export default {
  name: 'page-demo',
  setup(props, {}) {
    console.log(`setup`, arguments);
    //
    const formModel = reactive({
      id: '',
      putong1: '普通1级属性（初始值）',

      validateType1: new DataBackup({ a: '自定义类' }),
      test_noTypeMatch: 'str',
      test_include: {
        prop1: '',
        prop2: '',
        prop3: '',
      },
      test_exclude: {
        prop1: '',
        prop2: '',
        prop3: '',
      },

      judgeModel_none: {
        prop1: {},
        prop2: {},
        prop3: {},
      },

      tier_1_model_00_00: {
        test_params: {},

        arr_isModel: [0, 1, 2, 3],
        obj_noModel: {},

        test_setMethod: {},

        ovidVal: '0',

        ext2Name: '',
        tier_2_model_00_11: {
          m1Name: void 0,
          tier_3_model_01_11: {
            distance: null,
          },
        },

        policyList: [],
      },

      tier_1_shortToLong: {
        test: '短对长',
        alive: false,
        tier_2_shortToLong: {
          alive: false,
          tier_3_STL_short: {
            alive: false,
            tier_4_STL_short: {
              alive: false,
              test: '短对长-末端',
            },
          },
        },
      },
      tier_1_longToshort: {
        test: '长对短',
        alive: false,
        tier_2_longToShort: {
          Aalive: false,
          tier_3_LTS_long: {
            alive: false,
            tier_4_LTS_long: {
              alive: false,
              tier_5_LTS_long: {
                alive: false,
                test: '长对短一未端',
              },
            },
          },
        },
      },
    });

    const initFormModel = ref(JSON.stringify(formModel, null, 2));

    const sourceData = ref('');
    // 反向生成data
    const reverseData = ref('');

    // 分开 写入表单和生成数据 两种配置
    let setModelConfig = { tier_1_model_00_00: { config: {} } };
    let genDataConfig = { tier_1_model_00_00: { config: {} } };

    //组合一体的配置
    const integratedConfig = { tier_1_model_00_00: { config: {} } };

    setModelConfig['validateType1'] = {
      isModel: false,
      type: DataBackup,
    };
    genDataConfig['validateType1'] = setModelConfig['validateType1'];
    integratedConfig['validateType1'] = setModelConfig['validateTypel'];

    setModelConfig['test_noTypeMatch'] = {
      noTypeMatch: true,
    };
    genDataConfig['test_noTypeMatch'] = setModelConfig['test_noTypeMatch'];
    integratedConfig['test_noTypeMatch'] = setModelConfig['testanoTypeMatch'];

    setModelConfig['test_include'] = {
      include: ['prop1', 'prop2'],
    };
    genDataConfig['test_include'] = setModelConfig['test_include'];
    integratedConfig['test_include'] = setModelConfig['test_include'];

    setModelConfig['test_exclude'] = {
      exclude: ['prop1', 'prop2'],
    };
    genDataConfig['test_exclude'] = setModelConfig['test_exclude'];
    integratedConfig['test_exclude'] = setModelConfig['test_exclude'];

    const setModel_tier_1_config = setModelConfig.tier_1_model_00_00.config;
    const genData_tier_1_config = genDataConfig.tier_1_model_00_00.config;
    const integrated_tier_1_config = integratedConfig.tier_1_model_00_00.config;

    // 数组按模型处理。要注意生成data时如果也按模型处理, 自动创建的是普通对象。
    setModel_tier_1_config.arr_isModel = true;
    // genData_tier_1_config.arr_isModel = false;
    integrated_tier_1_config.arr_isModel = {
      isModel: true,
      createData() {
        // console.log('createData',this, arguments);
        return [];
      },
    };

    setModel_tier_1_config.obj_noModel = { isModel: false };
    genData_tier_1_config.obj_noModel = { isModel: false };
    integrated_tier_1_config.obj_noModel = { isModel: false };

    setModel_tier_1_config.ovidVal = { required: true, type: String };
    // genData_tier_1_config.ovidVal= {};
    integrated_tier_1_config.ovidVal = {
      modifyOptions: (opts, { reverse }) => {
        if (reverse) {
          return opts;
        }
        let _opts = { ...opts };
        _opts.required = true;
        _opts.type = String;
        return _opts;
      },
    };

    setModelConfig['tier_1_model_00_00.policyList'] = {
      path: 'policy',
      replace: (value, { assignModel }) => {
        if (!value) return value;
        const createInitItem = this.createInitPolicyItem;
        const opts = {
          exclude: ['temp_key'],
          config: Object.freeze({
            extJson: { config: Object.freeze({ indexCode: { type: Array } }) },
          }),
        };
        return value.map((item) => {
          let obj = createInitItem(item);
          assignModel(obj, item, opts);
          return obj;
        });
      },
    };
    genDataConfig['tier_1_model_00_00.policyList'] = {
      path: 'policy',
      replace: (value) => {
        if (!value) return [];
        return value.map((item) => ({ custCode: item.custCode, policyId: item.policyId }));
      },
    };
    integratedConfig['tier_1_model_00_00.policyList'] = {
      path: 'policy',
      replace: (value, { reverse, assignModel }) => {
        if (!value) return value;
        if (reverse) {
          return value.map((item) => ({ custCode: item.custCode, policyId: item.policyId }));
        }
        const createInitItem = this.createInitPolicyItem;
        const opts = {
          exclude: ['temp_key'],
          config: Object.freeze({
            extJson: { config: Object.freeze({ indexcode: { type: Array } }) },
          }),
        };
        return value.map((item) => {
          let obj = createInitItem(item);
          assignModel(obj, item, opts);
          return obj;
        });
      },
    };

    // 长路径对接; 这里修改了部分映射路径, 很不全面, 这会导致输出data时结构混乱
    const model_tier_4_STL_short = 'tier_l_shortToLong.tier_2_shortToLong.tier_3_STL_short.tier_4_STL_short';
    const data_tier_5_STL_long =
      'tier_1_shortToLong.tier_2_shortTolong.tier_3_STL_long.tier_4_STL_long.tier_5_STL_long';
    setModelConfig[model_tier_4_STL_short] = data_tier_5_STL_long;
    genDataConfig[model_tier_4_STL_short] = data_tier_5_STL_long;
    integratedConfig[model_tier_4_STL_short] = data_tier_5_STL_long;

    const model_tier_5_LTS_long =
      'tier_1_longToShort.tier_2_longToShort.tier_3_LTS_long.tier_4_LTS_long.tier_5_LTS_long';
    const data_tier_4_LTS_short = 'tier_1_longToShort.tier_2_longToShort.tier_3_LTS_short.tier_4_LTS_short';
    setModelConfig[model_tier_5_LTS_long] = data_tier_4_LTS_short;
    genDataConfig[model_tier_5_LTS_long] = data_tier_4_LTS_short;
    integratedConfig[model_tier_5_LTS_long] = data_tier_4_LTS_short;

    const topConfig = {
      'tier_11_model_0 22': {
        path: 'tier_1_model_00_00',
        config: Object.freeze({
          'tier_22_model_02_22.mode14.policy2': {
            path: 'tier_22_model_02_22.policy2',
            order: -100,
            judgeModel: '3',
          },
        }),
      },

      'tier_1_model_00_00.policyList': {
        required: true, // 不能是空值
        ignoreOwnProperty: true, // 默认数据无对应属性时会中断赋值, 是否忽略
        interceptor: () => true, // 自定义拦截器, 应返回布尔值
        validator: () => false, // 自定义验证函数, 应返回布尔值
        type: String,
      },
    };

    setModelConfig.validateType2 = setModelConfig.validateTypel;
    genDataConfig.validateType2 = genDataConfig.validateTypel;
    integratedConfig.validateType2 = integratedConfig.validateType1;

    setModelConfig = integratedConfig;
    genDataConfig = integratedConfig;

    return {
      formModel,
      initFormModel,
      sourceData,
      reverseData,

      setModelConfig,
      genDataConfig,
    };
  },
  mounted() {
    console.log(`mounted-this`, this);

    setTimeout(() => {
      let data = {
        id: 12341234,
        putong1: '普通1级属性（data值）',
        validateTypel: new DataBackup({ a: 'data-测试自定义类' }),
        validateType2: { a: 'data-普通对象' },

        test_noTypeMatch: true,
        test_include: {
          prop1: 'data-1',
          prop2: 'data-2',
          prop3: 'data-3',
        },
        test_exclude: {
          prop1: 'data-1',
          prop2: 'data-2',
          prop3: 'data-3',
        },

        tier_1_model_00_00: {
          arr_isModel: [20, 11, 12, 13, 14, 15],
          obj_noNodel: {
            prop1: 'data-1',
            obj1: { a: '11' },
            arr1: [1, 4],
          },

          ext2Name: 'ext2Name',
          ovidVal: void 0,
          alive: true,

          tier_2_model_00_11: {
            alive: true,
            id: 45665,
            code: 'moxing1',
            name: '模型1',
            dataMsg: void 0,
            tier_3_model_01_11: {
              pathTest1: [{ a: 1 }, { a: 4 }],
              distance: 45,
            },
          },
          tier_22_model_02_22: {
            alive: true,
            id: '',
            code: 'moxing22',
            name: '模型22',
            policy2: [
              { custCode: '客户13', policyId: 13 },
              { custCode: '客户14', policyId: 14 },
            ],
            distance: 45,
          },
          tier22fModel122: {
            alive: true,
            code: 'moxing55',
            policy2: [],
          },
        },

        policy: [
          { custCode: '客户25', policyId: 25 },
          { custCode: '客户27', policyId: 27 },
        ], // 分组策略

        tier_1_shortToLong: {
          test: 'data-短对长',
          alive: true,
          tier_2_shortToLong: {
            alive: true,
            tier_3_STL_long: {
              alive: true,
              tier4_STL_long: {
                alive: true,
                tier_5_STL_long: {
                  alive: true,
                  test: 'data-短对长-末端',
                },
              },
            },
          },
        },

        tier_1_LongToShort: {
          test: 'data-长对短',
          alive: true,
          tier_2_longToShort: {
            alive: true,
            tier_3_LTS_short: {
              alive: true,
              tier_4_LTS_short: {
                alive: true,
                test: 'data-长对短-末端',
              },
            },
          },
        },
      };
      this.sourceData = JSON.stringify(data, null, 2);
      this.setData(data);

      //
      setTimeout(() => {
        this.reverseData = JSON.stringify(this.getData(), null, 2);
      }, 2000);
    }, 2000);
  },
  methods: {
    //
    setData(data) {
      const { formModel } = this;
      $utils.assignModel(formModel, data, {
        config: this.setModelConfig,
        interceptInvalid: true, // 验证不通过的时候要拦截

        debugLog: true,
        // debugger: true,
        // debugTarget: formModel.tier_1_model_00_00,
        // debugTarget: formModel,
        // debugTrack: 'tier_1_shortToLong.tier_2_shortToLong.tier_3_STL_short.tier_4_STL_short',

        // debugDescend: true,
        // debugBehind: true,
      });
      console.log('setData-formModel-end------------------------------', formModel);
    },
    //
    getData() {
      const { formModel } = this;
      let data = {};
      $utils.assignModel(formModel, data, {
        config: this.genDataConfig,
        reverse: true, // 反向覆盖

        // debugLog: true,
        // debugger: true,
        // debugTarget: formModel.tier_11_model_00_22.tier_22_model_02_22,
        // debugDescend: true,
        // debugBehind: true,
      });
      console.log('getData-formModel-end------------------------------', data);
      return data;
    },

    // 生成初始策略
    createInitPolicyItem(data) {
      let temp_key = $utils.genGuid(); // 前端临时使用的key
      return {
        temp_key,
        custCode: data.custCode || '全量', // 客群标签
        policyId: data.policyId || null, // 投资策略
        isFoldExt: true, // 是否折叠拓展
        extJson: {
          indexCode: [], // 索引数组
        }, // 拓展
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.demo-page1 {
  padding: 10px;
}
.assign_model {
  display: flex;
  justify-content: space-around;
  > div {
    flex: 1;
    margin: 0 5px;
    display: flex;
    flex-flow: column nowrap;
    overflow: auto;
  }
  h4 {
    flex: none;
  }
  pre {
    flex: 1;
    overflow: auto;
  }
}
</style>
