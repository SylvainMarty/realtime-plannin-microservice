<script setup lang="ts">
import { Ref, ref, inject, computed } from "vue";
import { WebsocketSendMessage, WebsocketOnMessage} from "@/plugins/websocket";
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'

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
const fullCalendarOptions = ref({
  height: '100vh',
  aspectRatio: 10,
  plugins: [timeGridPlugin],
  initialView: 'timeGridWeek',
  weekNumbers: true,
  eventDisplay: 'block',
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: 'dayGridWeek,dayGridDay' // user can switch between the two
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
  sendMessage(
    "preparePlanning",
    {
      userId: userId.value,
      from: new Date('2023-12-12T00:00:00Z'),
      to: new Date('2023-12-16T23:59:59Z'),
    },
  );
}
</script>

<template>
  <FullCalendar :options="fullCalendarOptions">
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
