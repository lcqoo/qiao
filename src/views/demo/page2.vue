<script setup>
import {
  //
  ref,
  reactive,
  shallowReactive,
  toRef,
  toRefs,
  // computed,
  // nextTick,
} from 'vue';

const aRef = ref('a');
const obj1 = reactive({
  aRef,
  a1: 'av1',
  a2: 'av2',
});
console.log(`aRef.value === obj1.aRef`, aRef.value === obj1.aRef);
console.log(`aRef === obj1.aRef`, aRef === obj1.aRef);
console.log(`aRef === toRef(obj1, 'aRef')`, aRef === toRef(obj1, 'aRef'), aRef, toRef(obj1, 'aRef'));
const a1Ref = toRef(obj1, 'a1');
console.log(`a1Ref === obj1.a1`, a1Ref === obj1.a1, a1Ref, obj1);
obj1.aRef += '-1';
console.log(`aRef`, aRef, obj1);

const obj2 = reactive({
  b1: 'bv1',
  b2: 'bv2',
});
const obj2Refs = toRefs(obj2);
console.log(`obj2 === obj2Refs`, obj2 === obj2Refs, obj2, obj2Refs);
obj2.b1 += '-1';
console.log(`obj2.b1`, obj2.b1);
console.log(`obj2Refs.b1`, obj2.b1);

const obj3 = shallowReactive({
  aRef,
  a1: 'av1',
  a2: 'av2',
});
console.log(`aRef.value === obj3.aRef`, aRef.value === obj3.aRef);
console.log(`aRef === obj3.aRef`, aRef === obj3.aRef);
console.log(`aRef === toRef(obj3, 'aRef')`, aRef === toRef(obj3, 'aRef'), aRef, toRef(obj3, 'aRef'));
const a1Ref3 = toRef(obj3, 'a1');
console.log(`a1Ref3 === obj3.a1`, a1Ref3 === obj3.a1, a1Ref3, obj3);
</script>

<template>
  <div class="demo-page2">
    <p>obj2Refs.b1: {{ obj2Refs.b1 }}</p>
    <p>obj2Refs.b1 + '-2': {{ obj2Refs.b1 + '-2' }}</p>
    <p>obj1.aRef + '-1': {{ obj1.aRef + '-1' }}</p>
    <p>aRef + '-2': {{ aRef + '-2' }}</p>
    <p>aRef === obj1.aRef: {{ aRef === obj1.aRef }}</p>
    <p>aRef === obj3.aRef: {{ aRef === obj3.aRef }}</p>
    <p>obj3.aRef: {{ obj3.aRef }}</p>
    <p>obj3.aRef + '-3': {{ obj3.aRef + '-3' }}</p>
  </div>
</template>

<style scoped></style>
