import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import BottomSheet, {
  BottomSheetView,
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

// Функція для визначення якості повітря на основі CO2
const getAirQualityColor = (co2Level) => {
  if (!co2Level) return "#8FAEA2";
  if (co2Level < 400) return "#78FF8A"; // Відмінно
  if (co2Level < 600) return "#D6F01F"; // Добре
  if (co2Level < 1000) return "#FFB84D"; // Помірно
  return "#FF5C5C"; // Погано
};

const getAirQualityLabel = (co2Level) => {
  if (!co2Level) return "Невідомо";
  if (co2Level < 400) return "Відмінна";
  if (co2Level < 600) return "Добра";
  if (co2Level < 1000) return "Помірна";
  return "Погана";
};

function SensorCard({ icon: Icon, label, value, unit, color = "#8FAEA2" }) {
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
          {value !== null && value !== undefined ? value.toFixed(1) : "—"}
        </Text>
        <Text
          style={{
            color: "#9A9A9A",
            fontFamily: "Inter_400Regular",
            fontSize: 16,
          }}
        >
          {unit}
        </Text>
      </View>
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const fontsLoaded = useAppFonts();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const bottomSheetRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/devices");
      if (!response.ok) {
        throw new Error("Failed to fetch devices");
      }
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (device) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDevice(device);
    bottomSheetRef.current?.snapToIndex(0);

    // Центруємо карту на вибраному маркері
    mapRef.current?.animateToRegion({
      latitude: parseFloat(device.latitude),
      longitude: parseFloat(device.longitude),
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
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
          return (
            <Marker
              key={device.id}
              coordinate={{
                latitude: parseFloat(device.latitude),
                longitude: parseFloat(device.longitude),
              }}
              onPress={() => handleMarkerPress(device)}
            >
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Пульсуючий ефект */}
                <View
                  style={{
                    position: "absolute",
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: color,
                    opacity: 0.3,
                  }}
                />
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: color,
                    borderWidth: 3,
                    borderColor: "#FFF",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Заголовок */}
      <View
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 20,
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

      {/* Кнопка оновлення */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 40,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#D6F01F",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          fetchDevices();
        }}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Activity size={24} color="#000" />
        )}
      </TouchableOpacity>

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
                  backgroundColor: `${getAirQualityColor(selectedDevice.co2_level)}20`,
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
                      selectedDevice.co2_level,
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
                  Якість повітря: {getAirQualityLabel(selectedDevice.co2_level)}
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
              value={selectedDevice.precipitation}
              unit="мм"
              color="#6EB5FF"
            />

            <SensorCard
              icon={Activity}
              label="Кислотність (pH)"
              value={selectedDevice.ph_level}
              unit="pH"
              color="#D6F01F"
            />

            {/* Час оновлення */}
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

// Темна тема карти
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d0d0d0" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1f3a2f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212121" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9a9a9a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f1f1f" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f2f2f" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d0d0d0" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f2027" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f2027" }],
  },
];
