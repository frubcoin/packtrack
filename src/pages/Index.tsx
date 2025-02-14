import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCwIcon } from "lucide-react";
import confetti from 'canvas-confetti';

const pokeball = confetti.shapeFromPath({
  path: 'M770,1224.85H732c-1.49-1-3.21-.74-4.85-.82-43.27-1.91-85.66-9.09-126.64-23.08-151.15-51.57-254.79-152.44-311.12-301.58-14.9-39.48-23.16-80.65-26.63-122.76-.55-6.76-.06-13.62-1.76-20.28v-43a58.81,58.81,0,0,0,.89-5.86,461,461,0,0,1,17.86-106.37q47-160.89,181.91-260.55C529.06,290.81,604.73,261,687.76,250a479.9,479.9,0,0,1,103.69-2.35c37.6,3.17,74.47,9.93,110.19,22q208.55,70.45,299,271.14c21.87,48.51,34.17,99.72,38.6,152.8.58,6.92.1,13.95,1.8,20.77v42c-.3,2.1-.78,4.2-.88,6.31A464.49,464.49,0,0,1,1222.35,869q-43.32,149.69-164.66,247.69Q941,1210.57,791.31,1223.07C784.21,1223.67,777,1223.05,770,1224.85ZM438.72,766.6h-96c-7.34,0-7.35,0-6.51,7.5a455.59,455.59,0,0,0,7.62,48.7q32.9,148.47,153,241.88c65.33,50.8,139.8,79.07,222.48,85.42,48.25,3.71,96,.07,142.34-13.67,136.22-40.33,229.87-127.25,281-259.63,12.92-33.47,19.88-68.48,23.33-104.17.33-3.46.83-6.17-4.62-6.16q-98,.3-196,0c-3.42,0-4.7,1.17-5.18,4.31-.71,4.59-1.53,9.17-2.63,13.68-27.08,111-135,180.24-247.43,158.68-85.94-16.48-153.58-85.58-168.15-171.85-.58-3.44-1.83-4.87-5.73-4.85C503.71,766.68,471.21,766.6,438.72,766.6Zm165.37-31.32C604.13,815.92,670.26,882,751,882s146.87-66,146.94-146.66S831.91,588.73,751,588.69,604.05,654.66,604.09,735.28Z',
});

const defaults = {
  scalar: 4,
  spread: 250,
  particleCount: 75,
  origin: { y: -0.1 },
  startVelocity: -35
};

interface DataRow {
  [key: string]: string;
}

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRzhT3ACLoKbVHzGpaslY_l4cBCUqNf5kUh6QRlACgIFsQtBTHiiQya7eAt28DGselPyGxBd7NWY85G/pub?output=csv";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzCoVTQrWmFgHBE2LiebXtHJK3NwW-wirbkduFlYqQf1-RrC_9KTWi8LqAi4iZuKNwzXA/exec";

const Index = () => {
  const { toast } = useToast();
  const [inputValues, setInputValues] = useState<{ [key: number]: number }>({});
  const [pin, setPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  
  const actualPin = atob("NjY2MA=="); // Decoding the Base64 encoded PIN

  const { data: localData, isLoading, isError, refetch } = useQuery({
    queryKey: ["csvData"],
    queryFn: async () => {
      const response = await axios.get(CSV_URL);
      const rows = response.data
        .split("\n")
        .map((row: string) => {
          const values = row.split(",");
          return {
            name: values[0],
            value: values[1]?.trim() || "0",
          };
        });
      return rows;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ index, value }: { index: number, value: string }) => {
      const params = new URLSearchParams();
      params.append('index', String(index + 1));
      params.append('value', value);

      const response = await axios({
        method: 'post',
        url: `${APPS_SCRIPT_URL}?${params.toString()}`,
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      confetti({
        shapes: [pokeball],
        colors: ['#EE1515', '#F0F0F0'],
        ...defaults
      });

      toast({
        title: "Success",
        description: "Value updated in the spreadsheet",
      });

      // Re-fetch the data 4 times, 1 second apart
      for (let i = 1; i <= 4; i++) {
        setTimeout(() => {
          refetch();
        }, i * 1000); // 1 second apart
      }
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update the spreadsheet",
        variant: "destructive",
      });
    },
  });

  const handleIncrement = async (index: number) => {
    const amount = inputValues[index] || 0;
    const newValue = parseInt(localData[index].value) + amount;

    updateMutation.mutate({
      index,
      value: String(newValue),
    });

    setInputValues((prev) => ({ ...prev, [index]: 0 }));
  };

  const handleInputChange = (index: number, value: string) => {
    const numericValue = value ? parseInt(value) : 0;
    setInputValues((prev) => ({ ...prev, [index]: numericValue }));
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleIncrement(index);
    }
  };

  const handlePinSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pin === actualPin) {
      setIsPinVerified(true);
      setPin("");
    } else {
      toast({
        title: "Error",
        description: "Incorrect PIN",
        variant: "destructive",
      });
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Unable to load data</h2>
          <p className="text-gray-600">Please try again later</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">PackTrack™️</h1>
          <p>Input how many packs you opened to update your tracker!</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[250px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-[120px] ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                localData.map((row, index) => (
                  <TableRow key={index} className="group">
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.value}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {index < localData.length - 1 && (
                          <>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={inputValues[index] || ''}
                              onChange={(e) => handleInputChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              className="w-10 h-9 text-center border rounded text-lg"
                              placeholder="0"
                              disabled={!isPinVerified}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleIncrement(index)}
                              disabled={updateMutation.isPending || !isPinVerified}
                            >
                              Update
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <form onSubmit={handlePinSubmit} className="flex flex-col items-center mt-4">
          <input
            type="number"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="border rounded p-2 mb-2"
            required
          />
          <Button type="submit">Unlock Inputs</Button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>Changes are automatically saved to the spreadsheet</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
