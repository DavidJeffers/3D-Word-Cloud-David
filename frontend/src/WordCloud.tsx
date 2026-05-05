import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";

export interface WordData {
  word: string;
  weight: number;
}

interface WordCloudProps {
  words: WordData[];
  onWordClick: (word: string) => void;
}

function Word({
  position,
  size,
  color,
  text,
  onClick,
}: {
  position: THREE.Vector3;
  size: number;
  color: string;
  text: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const textRef = useRef<any>(null);

  useFrame(() => {
    if (textRef.current) {
      const targetScale = hovered ? 1.4 : 1;
      textRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15,
      );
    }
  });

  return (
    <Billboard position={position}>
      <Text
        ref={textRef}
        fontSize={size}
        color={hovered ? "#ffffff" : color}
        anchorX="center"
        anchorY="middle"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {text}
      </Text>
    </Billboard>
  );
}

export default function WordCloud({ words, onWordClick }: WordCloudProps) {
  const groupRef = useRef<THREE.Group>(null);

  const wordPositions = useMemo(() => {
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const count = shuffledWords.length;
    const radius = 12;

    const weights = shuffledWords.map((w) => w.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);

    return shuffledWords.map((wordData, i) => {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      const size =
        maxWeight === minWeight
          ? 1
          : 0.5 + ((wordData.weight - minWeight) / (maxWeight - minWeight)) * 2;

      const hue = 260 + (wordData.weight / maxWeight) * 60;

      return {
        ...wordData,
        size,
        color: `hsl(${hue}, 80%, 65%)`,
        position: new THREE.Vector3(
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi),
        ),
      };
    });
  }, [words]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      groupRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <group ref={groupRef}>
      {wordPositions.map((item, index) => (
        <Word
          key={index}
          position={item.position}
          size={item.size}
          color={item.color}
          text={item.word}
          onClick={() => onWordClick(item.word)}
        />
      ))}
    </group>
  );
}
