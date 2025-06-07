import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format, subMonths, isBefore } from "date-fns";
import { cn } from "../lib/utils";

// backend url
export const Backend_URL = "https://thebilling.in";
// export const Backend_URL = "http://localhost:3000";

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const DateRangePicker = ({ from, to, onSelect, onSearch, onCancel }) => {
  const [open, setOpen] = useState(false);

  const handleSearch = () => {
    onSearch();
    setOpen(false);
  };

  const handleCancel = () => {
    onCancel();
    setOpen(false);
  };

  const today = new Date();
  const lastMonth = subMonths(today, 1);

  return (
    <div className={cn("grid gap-2")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from ? (
              to ? (
                <>
                  {format(from, "LLL dd, y")} - {format(to, "LLL dd, y")}
                </>
              ) : (
                format(from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={lastMonth}
            selected={{ from, to }}
            onSelect={onSelect}
            numberOfMonths={2}
            disabled={(date) => isBefore(today, date)}
            toDate={today}
          />
          <div className="flex justify-end gap-2 p-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const convertFilterToDateRange = (filter) => {
  const today = new Date();
  let from, to;

  switch (filter) {
    case "Today":
      from = new Date(today.setHours(0, 0, 0, 0));
      to = new Date(today.setHours(23, 59, 59, 999));
      break;
    case "Yesterday":
      from = new Date(today.setDate(today.getDate() - 1));
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setHours(23, 59, 59, 999);
      break;
    case "This Week":
      from = new Date(today.setDate(today.getDate() - today.getDay()));
      from.setHours(0, 0, 0, 0);
      to = new Date(today.setDate(from.getDate() + 6));
      to.setHours(23, 59, 59, 999);
      break;
    case "This Month":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      to.setHours(23, 59, 59, 999);
      break;
    case "Last 7 Days":
      from = new Date(today.setDate(today.getDate() - 6));
      from.setHours(0, 0, 0, 0);
      to = new Date();
      to.setHours(23, 59, 59, 999);
      break;
    default:
      from = new Date(today.setDate(today.getDate() - 30));
      to = new Date();
  }

  // Add this log
  return { from, to };
};

export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0; // Avoid division by zero
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  return Number(change.toFixed(2)); // Round to 2 decimal places
};

export const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(":");
  let hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  return `${hour}:${minutes} ${ampm}`;
};

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];
const teens = [
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

export function convertLessThanOneThousand(number) {
  if (number === 0) {
    return "";
  }

  let words = "";

  if (number >= 100) {
    words += ones[Math.floor(number / 100)] + " Hundred ";
    number %= 100;
  }

  if (number >= 20) {
    words += tens[Math.floor(number / 10)] + " ";
    number %= 10;
  } else if (number >= 10) {
    words += teens[number - 10] + " ";
    return words.trim();
  }

  if (number > 0) {
    words += ones[number] + " ";
  }

  return words.trim();
}

export function numberToWords(number) {
  if (number === 0) return "Zero";

  const crore = Math.floor(number / 10000000);
  const lakh = Math.floor((number % 10000000) / 100000);
  const thousand = Math.floor((number % 100000) / 1000);
  const remainder = number % 1000;

  let words = "";

  if (crore > 0) {
    words += convertLessThanOneThousand(crore) + " Crore ";
  }

  if (lakh > 0) {
    words += convertLessThanOneThousand(lakh) + " Lakh ";
  }

  if (thousand > 0) {
    words += convertLessThanOneThousand(thousand) + " Thousand ";
  }

  if (remainder > 0) {
    words += convertLessThanOneThousand(remainder);
  }

  return words.trim();
}

export const s3Domain =
  "https://thousandwayspharmacy.s3.ap-south-1.amazonaws.com";

export const convertToFraction = (num) => {
  const value = Number(num);
  const ans = Math.round(value * 100) / 100;
  return ans;
};

export const convertQuantity = (qty, pack = 1) => {
  if (!qty) return "-";
  const packs = Math.floor(Number(qty) / Number(pack));
  const loose = qty % Number(pack);
  if (loose) {
    return `${packs} packs, ${loose} units`;
  }
  return `${packs} packs`;
};

export const convertQuantityValue = (qty, pack = 1) => {
  if (!qty) return 0;
  const packs = Math.floor(Number(qty) / Number(pack));
  const loose = qty % Number(pack);

  return { packs, loose };
};

export const MEDICINE_FORMS = [
  {
    medicine_form: "Tablet",
    short_medicine_form: "Tab",
    form_primary_pack: 10,
  },
  {
    medicine_form: "Syrup",
    short_medicine_form: null,
    form_primary_pack: 1,
  },
  {
    medicine_form: "Capsule",
    short_medicine_form: "Cap",
    form_primary_pack: 10,
  },
  {
    medicine_form: "Injection",
    short_medicine_form: null,
    form_primary_pack: 1,
  },
  {
    medicine_form: "Cream",
    short_medicine_form: null,
    form_primary_pack: 1,
  },
  {
    medicine_form: "Drops",
    short_medicine_form: "Drop",
    form_primary_pack: 1,
  },
  {
    medicine_form: "Powder",
    short_medicine_form: null,
    form_primary_pack: 1,
  },
  {
    medicine_form: "Paint",
    short_medicine_form: null,
    form_primary_pack: 1,
  },
  {
    medicine_form: "Gel",
    short_medicine_form: null,
    form_primary_pack: 1,
  },
  {
    medicine_form: "Suspension",
    short_medicine_form: "Susp",
    form_primary_pack: 1,
  },
  {
    medicine_form: "Liquid",
    short_medicine_form: null,
    form_primary_pack: 1,
  },
  {
    medicine_form: "Lotion",
    short_medicine_form: null,
    form_primary_pack: 1,
  },
  {
    medicine_form: "Ointment",
    short_medicine_form: "Oint",
    form_primary_pack: 1,
  },
  {
    medicine_form: "Oil",
    short_medicine_form: null,
    form_primary_pack: 1,
  },
  {
    medicine_form: "Solution",
    short_medicine_form: "Sol",
    form_primary_pack: 1,
  },
];
