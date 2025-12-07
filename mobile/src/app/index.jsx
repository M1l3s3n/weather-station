import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import BottomSheet, {
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  AlertCircle,
  Droplets,
  Thermometer,
  Activity,
  Wind,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import useAppFonts from "../hooks/useAppFonts";

const LVIV_CENTER = {
  latitude: 49.8397,
  longitude: 24.0297,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// !!! ПІДСТАВ СВОЮ IP-АДРЕСУ (та, що у тебе в браузері для /api/latest)
const API_URL = "http://192.168.65.58:3000";

// 2 фіктивні станції
const MOCK_DEVICES = [
  {
    id: "mock-1",
    name: "Тестова станція №1",
    location: "Площа Ринок",
    latitude: 49.8419,
    longitude: 24.0315,
    co2_level: 450,
    co_level: 12,
    temperature: 18.7,
    precipitation: 0, // не падає дощ
    humidity: 65,
    pressure: 1012,
    recorded_at: "2025-11-19T19:00:00Z",
  },
  {
    id: "mock-2",
    name: "Тестова станція №2",
    location: "Франківський район",
    latitude: 49.8245,
    longitude: 24.0123,
    co2_level: 720,
    co_level: 25,
    temperature: 20.4,
    precipitation: 1.2, // падає дощ
    humidity: 72,
    pressure: 1005,
    recorded_at: "2025-11-19T19:05:00Z",
  },
];

// Функція для визначення якості повітря на основі CO2
const getAirQualityColor = (co2Level) => {
  const value = Number(co2Level);
  if (Number.isNaN(value)) return "#8FAEA2";
  if (value < 400) return "#78FF8A"; // Відмінно
  if (value < 600) return "#D6F01F"; // Добре
  if (value < 1000) return "#FFB84D"; // Помірно
  return "#FF5C5C"; // Погано
};

const getAirQualityLabel = (co2Level) => {
  const value = Number(co2Level);
  if (Number.isNaN(value)) return "Невідомо";
  if (value < 400) return "Відмінна";
  if (value < 600) return "Добра";
  if (value < 1000) return "Помірна";
  return "Погана";
};

// Картка сенсора (з підтримкою valueText)
function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  color = "#8FAEA2",
  valueText,
}) {
  const numericValue =
    typeof value === "number" ? value : Number(value);

  const hasValue =
    numericValue !== null &&
    numericValue !== undefined &&
    !Number.isNaN(numericValue);

  return (
    <View
      style={{
        backgroundColor: "rgba(17, 17, 17, 0.8)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${color}20`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Icon size={18} color={color} />
        </View>
        <Text
          style={{
            color: "#9A9A9A",
            fontFamily: "Inter_500Medium",
            fontSize: 14,
          }}
        >
          {label}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Text
          style={{
            color: "#FFF",
            fontFamily: "Inter_700Bold",
            fontSize: 32,
            marginRight: 8,
          }}
        >
          {valueText
            ? valueText
            : hasValue
            ? numericValue.toFixed(1)
            : "—"}
        </Text>
        {!valueText && (
          <Text
            style={{
              color: "#9A9A9A",
              fontFamily: "Inter_400Regular",
              fontSize: 16,
            }}
          >
            {unit}
          </Text>
        )}
        {valueText && unit ? (
          <Text
            style={{
              color: "#9A9A9A",
              fontFamily: "Inter_400Regular",
              fontSize: 16,
            }}
          >
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const fontsLoaded = useAppFonts();

  // 🚨 За замовчуванням показуємо 2 фіктивні станції
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(false);

  const bottomSheetRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  // ⚡️ ТУТ МИ ТЯГНЕМО ОДНУ РЕАЛЬНУ СТАНЦІЮ З /api/latest
  const fetchDevices = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/latest`);

      if (!response.ok) {
        throw new Error("Backend returned error");
      }

      const raw = await response.json();
      console.log("RAW /api/latest:", raw);

      // Багато бекендів віддають { data: {...} }, тому спершу пробуємо raw.data
      const d = raw.data || raw;

      // ТВОЇ ДАНІ:
      // {
      //   temperature: 0,
      //   humidity: 37,
      //   pressure: 1017.7,
      //   rain: false,
      //   co2: 180,
      //   co: 1,
      //   gps: { lat: 49.8353, lon: 23.9952 }
      // }

      const latitude = Number(
        d.gps?.lat ?? d.latitude ?? d.lat ?? LVIV_CENTER.latitude
      );
      const longitude = Number(
        d.gps?.lon ?? d.longitude ?? d.lon ?? LVIV_CENTER.longitude
      );

      const realDevice = {
        id: d._id ? String(d._id) : "backend-station",
        name: d.name || "Метеостанція",
        location: "Львів",
        latitude,
        longitude,
        co2_level: Number(d.co2 ?? d.co2_level ?? 0),
        co_level: Number(d.co ?? d.co_level ?? 0),
        temperature: Number(d.temperature ?? d.temp ?? 0),
        precipitation: Number(
          d.precipitation ?? d.rain_mm ?? (d.rain ? 1 : 0) ?? 0
        ),
        humidity: Number(d.humidity ?? d.hum ?? 0),
        pressure: Number(d.pressure ?? d.press_hpa ?? 0),
        recorded_at: d.createdAt || d.timestamp || d.recorded_at || null,
      };

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        console.warn("Lat/lon from backend invalid, using only MOCK_DEVICES");
        setDevices(MOCK_DEVICES);
      } else {
        setDevices([realDevice, ...MOCK_DEVICES]);
      }
    } catch (error) {
      console.error("Error fetching devices from backend:", error);
      // якщо бек не працює – залишаємо тільки 2 мокові точки
      setDevices(MOCK_DEVICES);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (device) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDevice(device);
    bottomSheetRef.current?.snapToIndex(0);

    const latitude = Number(device.latitude);
    const longitude = Number(device.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const handleSheetClose = () => {
    setSelectedDevice(null);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* Карта */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={LVIV_CENTER}
        customMapStyle={mapStyle}
      >
        {devices.map((device) => {
          const color = getAirQualityColor(device.co2_level);
          const latitude = Number(device.latitude);
          const longitude = Number(device.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return (
            <Marker
              key={device.id}
              coordinate={{ latitude, longitude }}
              onPress={() => handleMarkerPress(device)}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: color,
                }}
              />
            </Marker>
          );
        })}
      </MapView>

      {/* Заголовок */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: insets.top + 20,
          paddingBottom: 16,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontFamily: "Inter_700Bold",
            fontSize: 28,
            marginBottom: 4,
          }}
        >
          Екомоніторинг Львова
        </Text>
        <Text
          style={{
            color: "#8FAEA2",
            fontFamily: "Inter_400Regular",
            fontSize: 14,
          }}
        >
          {devices.length} активних{" "}
          {devices.length === 1 ? "пристрій" : "пристроїв"}
        </Text>
      </View>

      {/* Легенда якості повітря */}
      <View
        style={{
          position: "absolute",
          bottom: 120,
          right: 20,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          borderRadius: 12,
          padding: 12,
          gap: 8,
        }}
      >
        {[
          { color: "#78FF8A", label: "Відмінна" },
          { color: "#D6F01F", label: "Добра" },
          { color: "#FFB84D", label: "Помірна" },
          { color: "#FF5C5C", label: "Погана" },
        ].map((item) => (
          <View
            key={item.label}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: item.color,
              }}
            />
            <Text
              style={{
                color: "#FFF",
                fontFamily: "Inter_400Regular",
                fontSize: 12,
              }}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Bottom Sheet з даними датчиків */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["75%"]}
        enablePanDownToClose
        onClose={handleSheetClose}
        backgroundStyle={{ backgroundColor: "#0B0B0B" }}
        handleIndicatorStyle={{ backgroundColor: "#333" }}
      >
        {selectedDevice && (
          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* Заголовок пристрою */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: "#FFF",
                  fontFamily: "Inter_700Bold",
                  fontSize: 24,
                  marginBottom: 8,
                }}
              >
                {selectedDevice.name}
              </Text>
              <Text
                style={{
                  color: "#9A9A9A",
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                {selectedDevice.location}
              </Text>

              {/* Індикатор якості повітря */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: `${getAirQualityColor(
                    selectedDevice.co2_level
                  )}20`,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: getAirQualityColor(selectedDevice.co2_level),
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: getAirQualityColor(
                      selectedDevice.co2_level
                    ),
                    marginRight: 8,
                  }}
                />
                <Text
                  style={{
                    color: "#FFF",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                  }}
                >
                  Якість повітря:{" "}
                  {getAirQualityLabel(selectedDevice.co2_level)}
                </Text>
              </View>
            </View>

            {/* Датчики */}
            <Text
              style={{
                color: "#FFF",
                fontFamily: "Inter_600SemiBold",
                fontSize: 18,
                marginBottom: 16,
              }}
            >
              Показники датчиків
            </Text>

            <SensorCard
              icon={Wind}
              label="Вуглекислий газ (CO₂)"
              value={selectedDevice.co2_level}
              unit="ppm"
              color={getAirQualityColor(selectedDevice.co2_level)}
            />

            <SensorCard
              icon={AlertCircle}
              label="Чадний газ (CO)"
              value={selectedDevice.co_level}
              unit="ppm"
              color="#FFB84D"
            />

            <SensorCard
              icon={Thermometer}
              label="Температура"
              value={selectedDevice.temperature}
              unit="°C"
              color="#8FAEA2"
            />

            <SensorCard
              icon={Droplets}
              label="Опади"
              value={0}
              valueText={
                Number(selectedDevice.precipitation) > 0
                  ? "Падає дощ"
                  : "Не падає дощ"
              }
              unit=""
              color="#6EB5FF"
            />

            <SensorCard
              icon={Activity}
              label="Атмосферний тиск"
              value={selectedDevice.pressure}
              unit="hPa"
              color="#D6F01F"
            />

            <SensorCard
              icon={Droplets}
              label="Вологість"
              value={selectedDevice.humidity}
              unit="%"
              color="#8FAEA2"
            />

            {selectedDevice.recorded_at && (
              <Text
                style={{
                  color: "#6E6E6F",
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 16,
                }}
              >
                Оновлено:{" "}
                {new Date(selectedDevice.recorded_at).toLocaleString("uk-UA")}
              </Text>
            )}
          </BottomSheetScrollView>
        )}
      </BottomSheet>
    </View>
  );
}

/**
 * Стиль карти: темний фон, мʼякі зелені дороги, світлі великі написи
 */
const mapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#050608" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#708a8b" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050608" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f5f9fa" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e2f3f5" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#00a86b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#007a50" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bff4dd" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#00b97a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#00865a" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d4ffe8" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#009463" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#006743" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#062c26" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4caf50" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#111315" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f7f80" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#02151a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#02151a" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#0b1214" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d0d0d0" }],
  },
];
