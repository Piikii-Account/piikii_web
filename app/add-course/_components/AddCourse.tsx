"use client";
import React, { useRef, useState, TouchEvent, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { CategoryChip } from "./CategoryChip";
import useCopyPasted from "../_hooks/useCopyPasted";
import useShare from "@/hooks/useShare";
import { RoomResponse } from "@/apis/room/types/model";

// 사용자가 설정한 데이터라고 가정
const initialColumns: ColumnsType = {
  course: {
    id: "course",
    list: {
      food: [{ globalIndex: 0, title: "음식점", type: "food", icon: "🍔" }],
      dessert: [{ globalIndex: 1, title: "카페", type: "dessert", icon: "🥨" }],
      beer: [
        { globalIndex: 2, title: "술 1차", type: "dessert", icon: "🍻" },
        { globalIndex: 3, title: "술 2차", type: "dessert", icon: "🍻" },
      ],
      play: [{ globalIndex: 4, title: "놀거리", type: "play", icon: "🕹️" }],
    },
  },
};

export interface AddCourseProps {
  data: RoomResponse;
}

const AddCourse = ({ data }: AddCourseProps) => {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  const { clipboardText } = useCopyPasted();
  const [placeUrl, setPlaceUrl] = useState("");
  const [showInput, setShowInput] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const roomUid = searchParams.get("roomUid") || "";
  const {
    roomInfo,
    setRoomInfo,
    categoryList,
    setCategoryList,
    placeInfo,
    setPlaceInfo,
    isClipboardText,
    setIsClipboardText,
    autoData,
    setAutoData,
  } = useCourseContext();

  const { data: currentPlacesData } = useGetPlacesQuery({
    variables: { roomUid },
  });

  const { mutate: createPlaceMutate } = useCreatePlace({
    options: {
      onSuccess: (res) => {
        if (res) {
          setAutoData(res);
        }
      },
      onError: (error) => {
        console.log(error);
      },
    },
  });

  const filteredPlaces = useMemo(() => {
    return (
      currentPlacesData?.places?.filter(
        (place) =>
          selectedCategory === null || place.scheduleId === selectedCategory
      ) || []
    );
  }, [currentPlacesData?.places, selectedCategory]);

  const fetchCoursePageData = async (roomUid: string) => {
    try {
      const currentSchedule = await scheduleApi.readSchedules(roomUid);
      const currentRoom = await roomApi.readRoom(roomUid);

      setCategoryList(currentSchedule.data.schedules);
      setRoomInfo(currentRoom.data);
      return;
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchCoursePageData(roomUid);
  }, [placeInfo, categoryList]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isMobile && clipboardText) {
        setShowInput(false);
        setIsClipboardText(true);
        createPlaceMutate({ url: clipboardText });
      } else if (placeUrl) {
        setShowInput(false);
        setIsClipboardText(true);
        createPlaceMutate({ url: placeUrl });
      } else {
        setShowInput(true);
      }
    };

    fetchData();
  }, [clipboardText, isMobile, placeUrl]);

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (sliderRef.current) {
      if (touchStartX - touchEndX > 50) {
        sliderRef.current.scrollBy({ left: 200, behavior: "smooth" });
      } else if (touchStartX - touchEndX < -50) {
        sliderRef.current.scrollBy({ left: -200, behavior: "smooth" });
      }
    }
  };

  const handleChipClick = (index: number) => {
    setSelectedChip(index === selectedChip ? null : index);
    setSelectedCategory(index === selectedCategory ? null : index);
  };

  const { onShare } = useShare();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center gap-x-[17px] cursor-pointer px-[20px] py-[11px]">
        <p className="flex w-[232px] text-semibold-15 text-neutral-700">
          {roomInfo?.name}
        </p>

        <Button className="flex border-2 border-[#E7E8EB] w-[86px] h-[34px] py-[8px] px-[12px] bg-white gap-[4px]">
          <p className="font-semibold text-neutral-700 text-[12px]">투표시작</p>
          <Image
            width={16}
            height={16}
            src="/gif/vote_button.gif"
            alt="vote_button.gif"
          />
        </Button>
      </div>
      <div
        className={`flex flex-col px-[20px] w-[335px] ${
          !showInput ? "h-[148px]" : "h-[103px]"
        } mt-[16px]`}
      >
        <div className="flex flex-row w-[224px] font-extrabold h-[31px] text-[22px] mb-[16px]">
          <p className="text-[#FF601C]">투표 후 코스</p>
          <p>를 추천받아요</p>
        </div>
        {showInput ? (
          <div className="flex w-[335px] h-[56px] px-[20px] py-[12px] gap-x-[16px] bg-[#FFF7F2] border-2 border-[#FFF1EB] rounded-[32px] items-center">
            <Input
              className="rounded-none p-0 shadow-none focus:bg-transparent w-[251px] h-[24px] bg-transparent border-none text-[#747B89]"
              placeholder="네이버, 카카오 링크를 넣어주세요"
              value={placeUrl}
              onChange={(e) => setPlaceUrl(e.target.value)}
            />
            <Image
              src={"/png/ic_arrow_left_circle_32.png"}
              alt="arrow"
              width={32}
              height={32}
              onClick={() => {
                if (placeUrl) {
                  router.push(
                    `add-course/detail?roomUid=${
                      roomUidStorage?.get()?.roomUid
                    }`
                  );
                }
              }}
            />
          </div>
        ) : (
          autoData && (
            <CardForCopiedContent
              name={autoData.data.name}
              url={autoData.data.url}
              placeImageUrls={autoData.data.placeImageUrls}
              starGrade={autoData.data.starGrade}
              reviewCount={autoData.data.reviewCount}
              origin={autoData.data.origin}
            />
          )
        )}
      </div>
      <div
        className="flex flex-row mt-[8px] mx-[20px] w-[335px] h-[37px] items-center py-[8px] pr-[12px]"
        onClick={() =>
          router.push(
            `add-course/detail?roomUid=${roomUidStorage?.get()?.roomUid}`
          )
        }
      >
        <div className="flex flex-row items-center justify-start gap-x-[6px] cursor-pointer">
          <Image
            src={"/png/ic_plus_circle_20.png"}
            alt="plus"
            width={20}
            height={20}
          />
          <p
            className="w-[52px] text-[14px] font-semibold text-[#B5B9C6]"
            onClick={() =>
              router.push(
                `add-course/detail?roomUid=${roomUidStorage?.get()?.roomUid}`
              )
            }
          >
            직접 추가
          </p>
        </div>
      </div>
      <div className="flex w-[375px] h-[12px] bg-[#F9FAFB] my-[20px]" />
      <div className="flex flex-row justify-between items-center">
        <div
          className="flex flex-start pl-[20px] w-full h-[37px] items-center gap-x-[8px] overflow-x-scroll scrollbar-hide"
          ref={sliderRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {categoryList?.map(
            (item) =>
              item.scheduleId &&
              item.name && (
                <CategoryChip
                  key={item.scheduleId}
                  title={item.name}
                  selected={selectedChip === item.scheduleId}
                  onClick={() => handleChipClick(item.scheduleId)}
                />
              )
          )}
        </div>
        <div className="relative flex items-center justify-center w-[64px] h-[37px] mr-[20px] cursor-pointer">
          <div className="absolute left-[-16px] w-[16px] h-full">
            <Image
              src={"/svg/gradient.svg"}
              width={16}
              height={37}
              alt="gradient"
            />
          </div>
          <div className="flex items-center justify-center w-[32px] h-[32px] border-2 border-[#E7E8EB] rounded-[16px]">
            <Image
              src={"/png/ic_arrow_left_right_20.png"}
              alt="plus"
              width={16}
              height={16}
              onClick={() => router.push("/edit-course")}
            />
          </div>
        </div>
      </div>
      {!currentPlacesData || currentPlacesData?.places == null ? (
        <div className="flex flex-col w-full h-full items-center justify-center mt-[64px]">
          <div className="flex flex-col items-center justify-center w-full h-[197px] gap-y-[12px]">
            <div className="flex w-[108px] h-[104px] items-center justify-center">
              <Image
                src={"/png/img_sample.png"}
                alt="sample"
                width={108}
                height={104}
              />
            </div>
            <div className="flex flex-col w-full items-center justify-center text-[14px] text-[#8B95A1]">
              <p className="flex w-full items-center justify-center">
                일행을 초대하고
              </p>
              <p className="flex w-full items-center justify-center">
                함께 장소를 추가하세요
              </p>
            </div>
            <Button className="w-[112px] h-[41px] hover:bg-transparent bg-transparent border-2 gap-x-[4px] rounded-[28px] border-[#FF601C] text-[#FF601C]">
              <Image
                src={"/svg/ic_wrap.svg"}
                alt="wrap"
                width={16}
                height={16}
              />
              <p>일행 초대</p>
            </Button>
          </div>
          <div className="flex flex-col w-full items-center justify-center text-[14px] text-[#8B95A1]">
            <p className="flex w-full items-center justify-center">
              일행을 초대하고
            </p>
            <p className="flex w-full items-center justify-center">
              함께 장소를 추가하세요
            </p>
          </div>
          <Button
            className="w-[112px] h-[41px] hover:bg-transparent bg-transparent border-2 gap-x-[4px] rounded-[28px] border-[#FF601C] text-[#FF601C]"
            onClick={async () =>
              await onShare({
                url: location.href,
                title: data.name,
                text: data.message,
              })
            }
          >
            <Image src={"/svg/ic_wrap.svg"} alt="wrap" width={16} height={16} />
            <p>일행 초대</p>
          </Button>
        </div>
      ) : (
        <PlaceContainer
          placesData={{ ...currentPlacesData, places: filteredPlaces }}
        />
      )}
    </div>
  );
};

export default AddCourse;
