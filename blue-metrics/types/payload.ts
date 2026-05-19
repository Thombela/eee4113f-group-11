type payload = {
  end_device_ids: {
    device_id: string,
    application_ids: { application_id: string },
    dev_eui: string
  },
  received_at: string,
  uplink_message: {
    f_port: number,
    frm_payload: string,
    decoded_payload: {
      battery_percent: number,
      dissolved_oxygen_mg_L: number,
      image_size_kB: number,
      latitude: number,
      longitude: number,
      mission_packet: string,
      salinity_ppt: number,
      system_status: string,
      temperature_C: number,
      tilt_x: number
    },
    rx_metadata: [ [Object] ],
    settings: { data_rate: [Object], frequency: string }
  },
  simulated: boolean
}