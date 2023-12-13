<script setup lang="ts">
import { Ref, ref, inject, computed } from "vue";
import { WebsocketSendMessage, WebsocketOnMessage} from "@/plugins/websocket";
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import frLocale from '@fullcalendar/core/locales/fr';

const userId: string = ref(null);
const planningData: Ref<Array<Record<string, { entries: Record<string, unknown> }>>> = ref([]);
const events = computed(() => {
  return planningData.value.reduce((acc, date) => {
    acc.push(...date.entries.map((entry) => {
      return {
        title: entry.title,
        start: entry.start,
        end: entry.end,
        extendedProps: {
          summary: entry.summary.replaceAll('\n', '<br>'),
        },
      }
    }))
    return acc
  }, [])
})
const fullCalendar = ref(null)
const fullCalendarOptions = ref({
  height: '100vh',
  aspectRatio: 10,
  plugins: [timeGridPlugin],
  locales: [frLocale],
  locale: 'fr',
  initialView: 'timeGridWeek',
  weekNumbers: true,
  eventDisplay: 'block',
  headerToolbar: {
    left: 'customPrev,customNext',
    center: 'title',
    right: '',
  },
  customButtons: {
    customPrev: {
      text: '<',
      click: function () {
        fullCalendar.value.getApi().prev();
        getPlanning();
      }
    },
    customNext: {
      text: '>',
      click: function () {
        fullCalendar.value.getApi().next();
        getPlanning();
      }
    },
  },
  events: events,
})

const sendMessage = inject<WebsocketSendMessage>("$sendMessage", () => {});
const onMessage = inject<WebsocketOnMessage>("$onMessage", () => {});

onMessage("userIdCreated", (parsedMessage) => {
  console.log(parsedMessage.event, parsedMessage?.data?.userId);
  userId.value = parsedMessage.data.userId;
  getPlanning();
});

onMessage("planningReady", (parsedMessage) => {
  console.log(parsedMessage.event, parsedMessage?.data?.userId);
  planningData.value = parsedMessage.data.planning;
});

function getPlanning() {
  const activeInterval = fullCalendar.value.getApi().currentData.dateProfile.activeRange;
  const from = new Date(activeInterval.start.getTime()).setHours(0, 0, 0);
  const to = new Date(activeInterval.end.getTime()).setHours(23, 59, 59);
  console.log('getPlanning', from, to);
  sendMessage(
    "preparePlanning",
    {
      userId: userId.value,
      from,
      to
    },
  );
}
</script>

<template>
  <FullCalendar ref="fullCalendar" :options="fullCalendarOptions">
    <template v-slot:eventContent="arg">
      <strong><u>{{ arg.event.title }}</u></strong>
      <div v-html="arg.event.extendedProps.summary"></div>
    </template>
  </FullCalendar>
</template>

<style scoped>
canvas[resize] {
  width: 99vw;
  height: 98vh;
}
</style>
